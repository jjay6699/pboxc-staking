import { NextRequest, NextResponse } from "next/server";
import { fetchSolanaBalanceLamports, normalizeCluster } from "@/server/solanaRpc";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet");
  const clusterParam = url.searchParams.get("cluster");

  if (!wallet) {
    return NextResponse.json({ error: "wallet is required" }, { status: 400 });
  }
  if (wallet.length < 32 || wallet.length > 64) {
    return NextResponse.json({ error: "invalid_wallet" }, { status: 400 });
  }

  try {
    const cluster = normalizeCluster(clusterParam);
    const result = await fetchSolanaBalanceLamports(wallet, cluster);
    return NextResponse.json({
      lamports: result.lamports,
      cluster: result.cluster,
      endpoint: result.endpoint,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "balance_failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
