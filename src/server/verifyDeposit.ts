import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { CONTRACT_ADDRESS } from "@/lib/config";
import { getRpcCandidates } from "@/server/solanaRpc";

const DEFAULT_COMMITMENT: "confirmed" | "finalized" = "confirmed";

const depositPublicKey = new PublicKey(CONTRACT_ADDRESS);

export type VerifiedDeposit = {
  lamports: number;
  slot: number;
  blockTime: number | null;
  feeLamports: number;
  cluster: string;
  endpoint: string;
};

const LAMPORT_TOLERANCE = 1_000; // ~0.000001 SOL

export async function verifyDepositSignature(args: {
  signature: string;
  walletAddress: string;
  expectedLamports?: number;
  cluster?: string | null;
}): Promise<VerifiedDeposit> {
  const { signature, walletAddress, expectedLamports, cluster } = args;
  if (!signature) {
    throw new Error("missing_signature");
  }

  let walletPublicKey: PublicKey;
  try {
    walletPublicKey = new PublicKey(walletAddress);
  } catch {
    throw new Error("invalid_wallet_address");
  }

  let tx;
  let usedCluster: string | null = null;
  let usedEndpoint: string | null = null;
  let lastError: Error | null = null;
  const candidates = getRpcCandidates(cluster);
  for (const candidate of candidates) {
    const connection = new Connection(candidate.endpoint, { commitment: DEFAULT_COMMITMENT });
    try {
      tx = await fetchTransactionWithRetry(connection, signature);
    } catch (e: any) {
      console.error("[verifyDeposit] failed to fetch transaction", candidate.endpoint, e);
      lastError = e instanceof Error ? e : new Error("transaction_fetch_failed");
      continue;
    }
    if (!tx) {
      lastError = new Error("transaction_not_found");
      continue;
    }
    usedCluster = candidate.cluster;
    usedEndpoint = candidate.endpoint;
    break;
  }

  if (!tx) {
    throw lastError ?? new Error("transaction_not_found");
  }

  if (tx.meta?.err) {
    throw new Error("transaction_failed");
  }

  const accountKeys = tx.transaction.message.accountKeys.map((account) => {
    const key = "pubkey" in account ? account.pubkey : account;
    return new PublicKey(key).toBase58();
  });

  const depositIndex = accountKeys.findIndex((k) => k === depositPublicKey.toBase58());
  if (depositIndex === -1) {
    throw new Error("deposit_address_not_present");
  }

  const preBalances = tx.meta?.preBalances ?? [];
  const postBalances = tx.meta?.postBalances ?? [];
  const lamportsReceived = (postBalances[depositIndex] ?? 0) - (preBalances[depositIndex] ?? 0);
  if (lamportsReceived <= 0) {
    throw new Error("no_lamports_received");
  }

  const walletIndex = accountKeys.findIndex((k) => k === walletPublicKey.toBase58());
  if (walletIndex === -1) {
    throw new Error("wallet_not_in_transaction");
  }

  const walletAccountMeta: any = tx.transaction.message.accountKeys[walletIndex];
  if (walletAccountMeta && "signer" in walletAccountMeta && walletAccountMeta.signer === false) {
    throw new Error("wallet_not_signer");
  }

  const walletDelta =
    (preBalances[walletIndex] ?? 0) - (postBalances[walletIndex] ?? 0);
  if (walletDelta <= 0) {
    throw new Error("wallet_did_not_send");
  }

  if (walletDelta < lamportsReceived) {
    throw new Error("wallet_delta_less_than_received");
  }

  if (
    typeof expectedLamports === "number" &&
    expectedLamports > 0 &&
    lamportsReceived + LAMPORT_TOLERANCE < expectedLamports
  ) {
    throw new Error("amount_mismatch");
  }

  return {
    lamports: lamportsReceived,
    slot: tx.slot,
    blockTime: tx.blockTime ?? null,
    feeLamports: tx.meta?.fee ?? 0,
    cluster: usedCluster ?? (cluster ?? "unknown"),
    endpoint: usedEndpoint ?? "unknown",
  };
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export { LAMPORTS_PER_SOL };

async function fetchTransactionWithRetry(connection: Connection, signature: string, attempts = 6, delayMs = 1200) {
  let lastErr: Error | null = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const tx = await connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: DEFAULT_COMMITMENT,
      });
      if (tx) return tx;
    } catch (err: any) {
      lastErr = err instanceof Error ? err : new Error("transaction_fetch_failed");
    }
    if (i < attempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  if (lastErr) throw lastErr;
  return null;
}
