export type PhantomPublicKey = { toString(): string; toBase58?: () => string };

export type PhantomConnectResult = { publicKey: PhantomPublicKey };

export type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: PhantomPublicKey;
  connect: (args?: { onlyIfTrusted?: boolean }) => Promise<PhantomConnectResult>;
  disconnect?: () => Promise<void>;
  on?: (event: "connect" | "disconnect" | "accountChanged", handler: (...args: any[]) => void) => void;
  request?: (args: { method: string; params?: any }) => Promise<any>;
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
    (window as any).__PBOXC_DEBUG__ = {
      solana: !!direct,
      phantom_solana: !!nested,
      isPhantom: !!prov?.isPhantom,
      hasPublicKey: !!prov?.publicKey,
    };
    console.log("[PBOXC] getPhantom", (window as any).__PBOXC_DEBUG__);
  }
  return prov ?? null;
}

export function waitForPhantom(timeoutMs = 1500): Promise<PhantomProvider | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const existing = getPhantom();
  if (existing) return Promise.resolve(existing);
  console.log("[PBOXC] waiting for phantom#initialized event...");
  return new Promise(resolve => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      console.warn("[PBOXC] phantom not detected within timeout");
      resolve(getPhantom());
    }, timeoutMs);
    window.addEventListener("phantom#initialized", () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      console.log("[PBOXC] phantom#initialized received");
      resolve(getPhantom());
    }, { once: true });
  });
}

export async function safeConnect(provider: PhantomProvider): Promise<string | null> {
  console.log("[PBOXC] safeConnect: starting", { hasRequest: !!provider.request });
  try {
    const res = await provider.connect({ onlyIfTrusted: false });
    const key = res?.publicKey?.toString?.() ?? null;
    console.log("[PBOXC] connect() resolved", { key });
    return key;
  } catch (e) {
    console.warn("[PBOXC] connect() failed, trying request('connect')", e);
    try {
      const res = await provider.request?.({ method: "connect" });
      const key = (res?.publicKey ?? provider.publicKey)?.toString?.() ?? null;
      console.log("[PBOXC] request('connect') resolved", { key });
      return key;
    } catch (e2) {
      console.error("[PBOXC] request('connect') failed", e2);
      return null;
    }
  }
}

export function buildPhantomTransferUrl(args: { recipient: string; amountSol?: number; cluster?: string; label?: string; message?: string }) {
  const { recipient, amountSol, cluster = "devnet", label, message } = args;
  const qp = new URLSearchParams();
  qp.set("recipient", recipient);
  qp.set("token", "SOL");
  qp.set("network", cluster === "mainnet" ? "mainnet-beta" : cluster);
  if (amountSol && amountSol > 0) qp.set("amount", String(amountSol));
  if (label) qp.set("label", label);
  if (message) qp.set("message", message);
  const url = `https://phantom.app/ul/v1/transfer?${qp.toString()}`;
  console.log("[PBOXC] transfer link", url);
  return url;
}

// Build and send a SystemProgram.transfer transaction which will open the Phantom extension UI
export async function sendSolViaPhantom(args: { provider: PhantomProvider; recipient: string; amountSol: number; cluster?: string }) {
  const { provider, recipient, amountSol, cluster = "devnet" } = args;
  const { Connection, PublicKey, SystemProgram, Transaction, clusterApiUrl } = await import("@solana/web3.js");
  const endpoint = cluster === "mainnet" ? clusterApiUrl("mainnet-beta") : clusterApiUrl("devnet");
  const connection = new Connection(endpoint, "confirmed");
  if (!provider.publicKey) throw new Error("Wallet not connected");
  const fromPubkey = new PublicKey(provider.publicKey.toString());
  const toPubkey = new PublicKey(recipient);
  const lamports = Math.round(amountSol * 1_000_000_000);
  if (lamports <= 0) throw new Error("Amount must be greater than 0");
  console.log("[PBOXC] building transfer", { from: fromPubkey.toBase58(), to: toPubkey.toBase58(), lamports });
  const ix = SystemProgram.transfer({ fromPubkey, toPubkey, lamports });
  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: fromPubkey }).add(ix);
  if (provider.signAndSendTransaction) {
    const { signature } = await provider.signAndSendTransaction(tx, { skipPreflight: false });
    console.log("[PBOXC] signAndSendTransaction signature", signature);
    return signature;
  }
  const signed = await provider.signTransaction?.(tx);
  if (!signed) throw new Error("Wallet cannot sign transaction");
  const sig = await connection.sendRawTransaction(signed.serialize());
  console.log("[PBOXC] sendRawTransaction signature", sig);
  return sig;
} 