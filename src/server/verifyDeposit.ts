import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { CONTRACT_ADDRESS, DEFAULT_CLUSTER } from "@/lib/config";

const DEFAULT_COMMITMENT: "confirmed" | "finalized" = "confirmed";

function resolveCluster(cluster: string): "devnet" | "mainnet-beta" | "testnet" {
  if (cluster === "mainnet" || cluster === "mainnet-beta") return "mainnet-beta";
  if (cluster === "testnet") return "testnet";
  return "devnet";
}

const RPC_ENDPOINT =
  process.env.SOLANA_RPC_URL ??
  clusterApiUrl(resolveCluster(DEFAULT_CLUSTER));

const connection = new Connection(RPC_ENDPOINT, DEFAULT_COMMITMENT, {
  commitment: DEFAULT_COMMITMENT,
});

const depositPublicKey = new PublicKey(CONTRACT_ADDRESS);

export type VerifiedDeposit = {
  lamports: number;
  slot: number;
  blockTime: number | null;
  feeLamports: number;
};

const LAMPORT_TOLERANCE = 1_000; // ~0.000001 SOL

export async function verifyDepositSignature(args: {
  signature: string;
  walletAddress: string;
  expectedLamports?: number;
}): Promise<VerifiedDeposit> {
  const { signature, walletAddress, expectedLamports } = args;
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
  try {
    tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: DEFAULT_COMMITMENT,
    });
  } catch (e) {
    console.error("[verifyDeposit] failed to fetch transaction", e);
    throw new Error("transaction_fetch_failed");
  }

  if (!tx) {
    throw new Error("transaction_not_found");
  }

  if (tx.meta?.err) {
    throw new Error("transaction_failed");
  }

  const accountKeys = tx.transaction.message.accountKeys.map((account) => {
    if ("pubkey" in account) return account.pubkey.toBase58();
    return account.toBase58();
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
  };
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export { LAMPORTS_PER_SOL }; 
