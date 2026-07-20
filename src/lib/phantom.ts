export type PhantomPublicKey = { toString(): string; toBase58?: () => string };

export type PhantomConnectResult = { publicKey: PhantomPublicKey };

export type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: PhantomPublicKey;
  connect: (args?: { onlyIfTrusted?: boolean }) => Promise<PhantomConnectResult>;
  disconnect?: () => Promise<void>;
  on?: (
    event: "connect" | "disconnect" | "accountChanged" | "networkChanged" | string,
    handler: (...args: any[]) => void
  ) => void;
  request?: (this: PhantomProvider, args: { method: string; params?: any }) => Promise<any>;
  signTransaction?: (tx: any) => Promise<any>;
  signAndSendTransaction?: (tx: any, opts?: any) => Promise<{ signature: string }>;
};

export function getPhantom(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  const anyWindow = window as any;
  const direct = anyWindow?.solana;
  const nested = anyWindow?.phantom?.solana;
  const prov = direct?.isPhantom ? direct : nested?.isPhantom ? nested : null;
  if (typeof window !== "undefined") {
    (window as any).__CREX_DEBUG__ = {
      solana: !!direct,
      phantom_solana: !!nested,
      isPhantom: !!prov?.isPhantom,
      hasPublicKey: !!prov?.publicKey,
    };
    console.log("[CREX] getPhantom", (window as any).__CREX_DEBUG__);
  }
  return prov ?? null;
}

export function waitForPhantom(timeoutMs = 1500): Promise<PhantomProvider | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const existing = getPhantom();
  if (existing) return Promise.resolve(existing);
  console.log("[CREX] waiting for phantom#initialized event...");
  return new Promise(resolve => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      console.warn("[CREX] phantom not detected within timeout");
      resolve(getPhantom());
    }, timeoutMs);
    window.addEventListener("phantom#initialized", () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      console.log("[CREX] phantom#initialized received");
      resolve(getPhantom());
    }, { once: true });
  });
}

export async function safeConnect(provider: PhantomProvider): Promise<string | null> {
  console.log("[CREX] safeConnect: starting", { hasRequest: !!provider.request });
  try {
    const res = await provider.connect({ onlyIfTrusted: false });
    const key = res?.publicKey?.toString?.() ?? null;
    console.log("[CREX] connect() resolved", { key });
    return key;
  } catch (e) {
    console.warn("[CREX] connect() failed, trying request('connect')", e);
    try {
      const res = await provider.request?.({ method: "connect" });
      const key = (res?.publicKey ?? provider.publicKey)?.toString?.() ?? null;
      console.log("[CREX] request('connect') resolved", { key });
      return key;
    } catch (e2) {
      console.error("[CREX] request('connect') failed", e2);
      return null;
    }
  }
}

export function buildPhantomTransferUrl(args: { recipient: string; amountSol?: number; cluster?: string; label?: string; message?: string }) {
  const { recipient, amountSol, cluster = "devnet", label, message } = args;
  const qp = new URLSearchParams();
  qp.set("recipient", recipient);
  qp.set("token", "SOL");
  qp.set("network", normalizeClusterForRpc(cluster));
  if (amountSol && amountSol > 0) qp.set("amount", String(amountSol));
  if (label) qp.set("label", label);
  if (message) qp.set("message", message);
  const url = `https://phantom.app/ul/v1/transfer?${qp.toString()}`;
  console.log("[CREX] transfer link", url);
  return url;
}

// Build and send a SystemProgram.transfer transaction which will open the Phantom extension UI
export async function sendSolViaPhantom(args: { provider: PhantomProvider; recipient: string; amountSol: number; cluster?: string; rpcEndpoint?: string | null }) {
  const { provider, recipient, amountSol, cluster = "devnet" } = args;
  const { PublicKey, SystemProgram, Transaction } = await import("@solana/web3.js");
  const network = normalizeClusterForRpc(cluster);
  if (!provider.publicKey) throw new Error("Wallet not connected");
  const fromPubkey = new PublicKey(provider.publicKey.toString());
  const toPubkey = new PublicKey(recipient);
  const lamports = Math.round(amountSol * 1_000_000_000);
  if (lamports <= 0) throw new Error("Amount must be greater than 0");
  console.log("[CREX] building transfer", { from: fromPubkey.toBase58(), to: toPubkey.toBase58(), lamports });
  const ix = SystemProgram.transfer({ fromPubkey, toPubkey, lamports });
  const bh = await fetchBlockhashFromApi(network);
  const tx = new Transaction({ recentBlockhash: bh.blockhash, feePayer: fromPubkey }).add(ix);
  (tx as any).lastValidBlockHeight = bh.lastValidBlockHeight;
  if (provider.signAndSendTransaction) {
    const { signature } = await provider.signAndSendTransaction(tx, { skipPreflight: false });
    console.log("[CREX] signAndSendTransaction signature", signature, "via", bh.endpoint);
    return signature;
  }
  const signed = await provider.signTransaction?.(tx);
  if (!signed) throw new Error("Wallet cannot sign transaction");
  const base64 = toBase64(signed.serialize());
  const signature = await sendRawViaApi(base64, network);
  console.log("[CREX] sendRawTransaction via API signature", signature);
  return signature;
}

function normalizeClusterForRpc(cluster?: string): "devnet" | "mainnet-beta" | "testnet" {
  const value = (cluster ?? "devnet").toLowerCase();
  if (/^https?:\/\//i.test(value)) {
    if (value.includes("mainnet")) return "mainnet-beta";
    if (value.includes("testnet")) return "testnet";
    if (value.includes("devnet")) return "devnet";
    return "devnet";
  }
  if (value === "mainnet") return "mainnet-beta";
  if (value === "mainnet-beta" || value === "devnet" || value === "testnet") return value as "mainnet-beta" | "devnet" | "testnet";
  return "devnet";
}

async function fetchBlockhashFromApi(cluster: string) {
  const params = new URLSearchParams();
  if (cluster) params.set("cluster", cluster);
  const res = await fetch(`/api/solana/blockhash?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`blockhash_api ${res.status} ${text}`);
  }
  const data = await res.json();
  if (!data?.blockhash) throw new Error("blockhash_api_missing_data");
  return data as { blockhash: string; lastValidBlockHeight: number; endpoint: string; cluster: string };
}

async function sendRawViaApi(serialized: string, cluster: string) {
  const res = await fetch("/api/solana/sendRaw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: serialized, cluster }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`sendRaw_api ${res.status} ${text}`);
  }
  const data = await res.json();
  if (!data?.signature) throw new Error("sendRaw_api_missing_signature");
  return data.signature as string;
}

function toBase64(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
}
