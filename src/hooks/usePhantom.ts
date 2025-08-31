"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PhantomProvider, waitForPhantom, safeConnect } from "@/lib/phantom";
import { DEFAULT_CLUSTER, getNetworkLabel } from "@/lib/config";

export function usePhantom() {
  const [provider, setProvider] = useState<PhantomProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [cluster] = useState<string>(DEFAULT_CLUSTER);
  const [balanceSol, setBalanceSol] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    waitForPhantom().then(p => {
      if (!mounted) return;
      setProvider(p);
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
    });
    return () => { mounted = false; };
  }, []);

  // Fetch balance when address/cluster changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!address) { setBalanceSol(null); return; }
      try {
        const { Connection, PublicKey, clusterApiUrl } = await import("@solana/web3.js");
        const endpoint = cluster === "mainnet" ? clusterApiUrl("mainnet-beta") : clusterApiUrl("devnet");
        const conn = new Connection(endpoint, "confirmed");
        const lamports = await conn.getBalance(new PublicKey(address));
        if (!cancelled) setBalanceSol(lamports / 1_000_000_000);
      } catch {
        if (!cancelled) setBalanceSol(null);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [address, cluster]);

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

  return { provider, address, networkLabel, connecting, connect, disconnect, lastError, isConnected, balanceSol };
} 