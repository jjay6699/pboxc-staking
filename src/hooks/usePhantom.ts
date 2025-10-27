"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PhantomProvider, waitForPhantom, safeConnect } from "@/lib/phantom";
import { DEFAULT_CLUSTER, getNetworkLabel } from "@/lib/config";

const LAMPORTS_PER_SOL = 1_000_000_000;

function normalizeClusterKey(cluster?: string | null) {
  if (!cluster) return DEFAULT_CLUSTER;
  if (cluster === "mainnet") return "mainnet-beta";
  if (isHttpEndpoint(cluster)) {
    if (/devnet/i.test(cluster)) return "devnet";
    if (/testnet/i.test(cluster)) return "testnet";
    if (/mainnet/i.test(cluster)) return "mainnet-beta";
    return DEFAULT_CLUSTER;
  }
  return cluster;
}

function isHttpEndpoint(value: string) {
  return /^https?:\/\//i.test(value);
}

type BalanceApiResult = {
  lamports: number;
  cluster: string;
  endpoint: string | null;
};

async function fetchBalanceViaApi(address: string, cluster: string): Promise<BalanceApiResult> {
  const params = new URLSearchParams({ wallet: address });
  const normalized = normalizeClusterKey(cluster);
  if (normalized) params.set("cluster", normalized);

  const res = await fetch(`/api/wallet/balance?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Balance API ${res.status} ${text}`);
  }

  const json: any = await res.json().catch(() => ({}));
  if (typeof json?.lamports === "number") {
    return {
      lamports: json.lamports as number,
      cluster: typeof json.cluster === "string" ? json.cluster : normalized,
      endpoint: typeof json.endpoint === "string" ? json.endpoint : null,
    };
  }
  const errMsg = typeof json?.error === "string" ? json.error : "balance_api_error";
  throw new Error(errMsg);
}

export function usePhantom() {
  const [provider, setProvider] = useState<PhantomProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [cluster, setCluster] = useState<string>(normalizeClusterKey(DEFAULT_CLUSTER));
  const [rpcEndpoint, setRpcEndpoint] = useState<string | null>(null);
  const [balanceSol, setBalanceSol] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    waitForPhantom().then(p => {
      if (!mounted) return;
      setProvider(p);
      const endpoint = getEndpointFromProvider(p);
      if (endpoint) {
        setRpcEndpoint(endpoint);
        const normalized = clusterFromEndpoint(endpoint) ?? normalizeClusterKey(DEFAULT_CLUSTER);
        setCluster(normalized);
        console.log("[PBOXC] detected cluster from endpoint", normalized, endpoint);
      }
      if (p?.publicKey) setAddress(p.publicKey.toString());
      p?.on?.("connect", (pk: any) => {
        const str = typeof pk?.toString === "function" ? pk.toString() : p?.publicKey?.toString();
        if (str) setAddress(str);
      });
      p?.on?.("accountChanged", (pk: any) => {
        if (pk) setAddress(typeof pk.toString === "function" ? pk.toString() : null);
        else setAddress(null);
      });
      p?.on?.("disconnect", () => {
        setAddress(null);
      });
      p?.on?.("networkChanged", (next: any) => {
        const normalized = typeof next === "string" ? clusterFromEndpoint(next) ?? genesisToCluster(next) ?? normalizeClusterKey(next) : null;
        if (normalized) {
          console.log("[PBOXC] networkChanged", normalized, next);
          setCluster(normalized);
        }
        if (typeof next === "string" && isHttpEndpoint(next)) {
          setRpcEndpoint(next);
        }
      });
    });
    return () => { mounted = false; };
  }, []);

  // Detect active network once provider is available/connected
  useEffect(() => {
    if (!provider?.request) return;
    let cancelled = false;
    async function detectCluster() {
      try {
        const resp = await provider.request!({ method: "getGenesisHash" });
        if (cancelled) return;
        const genesis = typeof resp === "string" ? resp : resp?.result;
        if (typeof genesis === "string" && genesis.length > 0) {
          const normalized = genesisToCluster(genesis) ?? DEFAULT_CLUSTER;
          const finalCluster = normalizeClusterKey(normalized);
          setCluster(finalCluster);
          console.log("[PBOXC] detected cluster from genesis", finalCluster);
        }
      } catch (err) {
        console.warn("[PBOXC] getGenesisHash failed, keeping default cluster", err);
      }
    }
    detectCluster();
    return () => { cancelled = true; };
  }, [provider, address]);

  // Fetch balance when address/cluster changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!address) { setBalanceSol(null); return; }
      const providerLamports = await requestBalanceFromProvider(provider, address).catch(err => {
        console.warn("[PBOXC] provider.getBalance failed, falling back to API", err);
        return null;
      });
      if (providerLamports != null) {
        if (!cancelled) {
          setBalanceSol(providerLamports / LAMPORTS_PER_SOL);
          const endpoint = getEndpointFromProvider(provider);
          if (endpoint) setRpcEndpoint(endpoint);
        }
        return;
      }

      try {
        const apiResult = await fetchBalanceViaApi(address, cluster);
        if (!cancelled) {
          setBalanceSol(apiResult.lamports / LAMPORTS_PER_SOL);
          const normalizedCluster = normalizeClusterKey(apiResult.cluster);
          if (normalizedCluster && normalizedCluster !== cluster) {
            setCluster(normalizedCluster);
          }
          if (apiResult.endpoint) {
            setRpcEndpoint(apiResult.endpoint);
          }
        }
        return;
      } catch (err) {
        console.error("[PBOXC] balance API fetch failed", err);
      }

      if (!cancelled) setBalanceSol(null);
    }
    load();
    return () => { cancelled = true; };
  }, [address, cluster, provider]);

  const networkLabel = useMemo(() => getNetworkLabel(cluster), [cluster]);
  const isConnected = !!address;

  const connect = useCallback(async () => {
    const p = provider ?? (await waitForPhantom());
    if (!p) {
      window.open("https://phantom.app/", "_blank");
      return;
    }
    try {
      setConnecting(true);
      setLastError(null);
      const addr = await safeConnect(p);
      if (addr) setAddress(addr);
      else setLastError("Phantom did not return a public key.");
    } catch (e: any) {
      setLastError(e?.message || "Connect failed");
    } finally {
      setConnecting(false);
    }
  }, [provider]);

  const disconnect = useCallback(async () => {
    const p = provider ?? (await waitForPhantom());
    try {
      await p?.disconnect?.();
    } finally {
      setAddress(null);
    }
  }, [provider]);

  return { provider, address, cluster, rpcEndpoint, networkLabel, connecting, connect, disconnect, lastError, isConnected, balanceSol };
}

function extractLamports(result: any): number | null {
  if (typeof result === "number") return result;
  if (result && typeof result === "object") {
    if (typeof result.value === "number") return result.value;
    if (result.result && typeof result.result.value === "number") return result.result.value;
  }
  return null;
}

const GENESIS_HASH_TO_CLUSTER: Record<string, string> = {
  "5eykt4UsFv8P8NJdTREpBkp9Ru5Ditwb9g3uDr8Abr9": "mainnet-beta",
  "EtWTRABZaYq6iMfeYKouRu166VU2xqa1e1M2tcFZzhhT": "devnet",
  "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY": "testnet",
};

function genesisToCluster(genesis: string): string | undefined {
  return GENESIS_HASH_TO_CLUSTER[genesis];
}

async function requestBalanceFromProvider(provider: PhantomProvider | null, address: string) {
  if (!provider?.request) return null;
  const result = await provider.request({
    method: "getBalance",
    params: [
      address,
      { commitment: "processed" },
    ],
  });
  return extractLamports(result);
}

function getEndpointFromProvider(provider: PhantomProvider | null): string | null {
  if (!provider) return null;
  const maybe = (provider as any)?.rpcEndpoint ?? (provider as any)?._rpcEndpoint ?? null;
  if (typeof maybe === "string" && maybe.length > 0) return maybe;
  return null;
}

function clusterFromEndpoint(endpoint: string): string | null {
  if (!endpoint) return null;
  if (!isHttpEndpoint(endpoint)) return normalizeClusterKey(endpoint);
  if (/devnet/i.test(endpoint)) return "devnet";
  if (/testnet/i.test(endpoint)) return "testnet";
  if (/mainnet/i.test(endpoint) || /mainnet-beta/i.test(endpoint)) return "mainnet-beta";
  return normalizeClusterKey(endpoint);
}
