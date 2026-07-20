import "server-only";

import { Connection } from "@solana/web3.js";
import { Buffer } from "buffer";
import { DEFAULT_CLUSTER } from "@/lib/config";

const LAMPORTS_PER_SOL = 1_000_000_000;
const DEFAULT_COMMITMENT: "confirmed" | "finalized" = "confirmed";

const DEFAULT_ENDPOINTS: Record<string, string> = {
  devnet: "https://api.devnet.solana.com",
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  mainnet: "https://api.mainnet-beta.solana.com",
  testnet: "https://api.testnet.solana.com",
};

const OVERRIDE_ENV_KEYS: Record<string, string[]> = {
  devnet: ["SOLANA_RPC_DEVNET", "NEXT_PUBLIC_SOLANA_RPC_DEVNET"],
  "mainnet-beta": [
    "SOLANA_RPC_MAINNET_BETA",
    "SOLANA_RPC_MAINNET",
    "NEXT_PUBLIC_SOLANA_RPC_MAINNET_BETA",
    "NEXT_PUBLIC_SOLANA_RPC_MAINNET",
  ],
  testnet: ["SOLANA_RPC_TESTNET", "NEXT_PUBLIC_SOLANA_RPC_TESTNET"],
};

const GLOBAL_RPC_KEYS = ["SOLANA_RPC_URL", "NEXT_PUBLIC_SOLANA_RPC_URL"];

const HTTP_REGEX = /^https?:\/\//i;

export type SolanaCluster = "devnet" | "testnet" | "mainnet-beta";

export type RpcCandidate = {
  endpoint: string;
  cluster: SolanaCluster;
  source: string;
};

type BalanceResult = {
  lamports: number;
  cluster: SolanaCluster;
  endpoint: string;
};

type BlockhashResult = {
  blockhash: string;
  lastValidBlockHeight: number;
  cluster: SolanaCluster;
  endpoint: string;
};

export async function fetchSolanaBalanceLamports(address: string, cluster: string | null | undefined): Promise<BalanceResult> {
  const candidates = getRpcCandidates(cluster);
  let lastError: unknown = null;
  let zeroResult: BalanceResult | null = null;
  for (const candidate of candidates) {
    try {
      const lamports = await queryLamports(candidate.endpoint, address);
      const result: BalanceResult = { lamports, cluster: candidate.cluster, endpoint: candidate.endpoint };
      if (lamports > 0) {
        return result;
      }
      zeroResult = result;
      console.warn("[CREX] RPC returned 0 lamports, trying next candidate", candidate.endpoint);
      continue;
    } catch (err) {
      lastError = err;
      console.warn(`[CREX] RPC balance failed (${candidate.source})`, candidate.endpoint, err);
      continue;
    }
  }
  if (zeroResult) return zeroResult;
  throw lastError instanceof Error ? lastError : new Error("balance_fetch_failed");
}

export function getRpcCandidates(cluster: string | null | undefined): RpcCandidate[] {
  const normalized = normalizeCluster(cluster);
  const out: RpcCandidate[] = [];
  const seen = new Set<string>();

  const add = (clusterKey: SolanaCluster, endpoint: string | null | undefined, source: string) => {
    if (!endpoint) return;
    const target = endpoint.trim();
    if (!target) return;
    if (seen.has(target)) return;
    seen.add(target);
    out.push({ endpoint: target, cluster: clusterKey, source });
  };

  const pushEnv = (clusterKey: SolanaCluster) => {
    const keys = OVERRIDE_ENV_KEYS[clusterKey] ?? [];
    for (const key of keys) {
      const value = process.env[key];
      if (value) add(clusterKey, value, key);
    }
  };

  const pushGlobal = () => {
    for (const key of GLOBAL_RPC_KEYS) {
      const value = process.env[key];
      if (value) {
        const clusterKey = inferClusterFromEndpoint(value) ?? normalized;
        add(clusterKey, value, key);
      }
    }
  };

  pushEnv(normalized);
  pushGlobal();
  add(normalized, DEFAULT_ENDPOINTS[normalized], "default");

  // Fallbacks in case overrides point to the wrong network.
  const fallbacks: SolanaCluster[] = ["mainnet-beta", "devnet", "testnet"];
  for (const c of fallbacks) {
    if (c === normalized) continue;
    pushEnv(c);
    add(c, DEFAULT_ENDPOINTS[c], "fallback");
  }

  return out;
}

async function queryLamports(endpoint: string, address: string): Promise<number> {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: `crex-server-balance-${address}`,
    method: "getBalance",
    params: [address, { commitment: "processed" }],
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`RPC responded with ${response.status}`);
  }

  const json: any = await response.json();
  if (typeof json?.result?.value === "number") return json.result.value;
  if (json?.error?.message) throw new Error(json.error.message);

  throw new Error("RPC returned unexpected payload");
}

export function normalizeCluster(cluster: string | null | undefined): SolanaCluster {
  const value = cluster?.toLowerCase().trim() || DEFAULT_CLUSTER;
  if (value === "mainnet" || value === "mainnet-beta") return "mainnet-beta";
  if (value === "devnet") return "devnet";
  if (value === "testnet") return "testnet";
  return DEFAULT_CLUSTER === "mainnet" ? "mainnet-beta" : (DEFAULT_CLUSTER as SolanaCluster);
}

export function inferClusterFromEndpoint(endpoint: string | null | undefined): SolanaCluster | null {
  if (!endpoint) return null;
  if (!HTTP_REGEX.test(endpoint)) {
    return normalizeCluster(endpoint) ?? null;
  }
  if (/devnet/i.test(endpoint)) return "devnet";
  if (/testnet/i.test(endpoint)) return "testnet";
  if (/mainnet/i.test(endpoint) || /mainnet-beta/i.test(endpoint)) return "mainnet-beta";
  return null;
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function solToLamports(amount: number): number {
  return Math.round(amount * LAMPORTS_PER_SOL);
}

export async function fetchLatestBlockhash(cluster: string | null | undefined): Promise<BlockhashResult> {
  const candidates = getRpcCandidates(cluster);
  let lastError: unknown = null;
  for (const candidate of candidates) {
    try {
      const connection = new Connection(candidate.endpoint, { commitment: DEFAULT_COMMITMENT });
      const info = await connection.getLatestBlockhash(DEFAULT_COMMITMENT);
      return {
        blockhash: info.blockhash,
        lastValidBlockHeight: info.lastValidBlockHeight,
        cluster: candidate.cluster,
        endpoint: candidate.endpoint,
      };
    } catch (err) {
      lastError = err;
      console.warn("[CREX] blockhash fetch failed", candidate.endpoint, err);
      continue;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("blockhash_fetch_failed");
}

export async function sendRawTransactionBase64(signedTxn: string, cluster: string | null | undefined): Promise<{ signature: string; endpoint: string; cluster: SolanaCluster }> {
  const candidates = getRpcCandidates(cluster);
  let lastError: unknown = null;
  for (const candidate of candidates) {
    try {
      const connection = new Connection(candidate.endpoint, { commitment: DEFAULT_COMMITMENT });
      const buffer = Buffer.from(signedTxn, "base64");
      const signature = await connection.sendRawTransaction(buffer, {
        skipPreflight: false,
        preflightCommitment: DEFAULT_COMMITMENT,
      });
      return { signature, endpoint: candidate.endpoint, cluster: candidate.cluster };
    } catch (err) {
      lastError = err;
      console.warn("[CREX] sendRawTransaction failed", candidate.endpoint, err);
      continue;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("send_raw_failed");
}
