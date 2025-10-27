import { NextRequest, NextResponse } from "next/server";
import { fetchLatestBlockhash } from "@/server/solanaRpc";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const cluster = url.searchParams.get("cluster");
  try {
    const result = await fetchLatestBlockhash(cluster);
    return NextResponse.json({
      blockhash: result.blockhash,
      lastValidBlockHeight: result.lastValidBlockHeight,
      endpoint: result.endpoint,
      cluster: result.cluster,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "blockhash_failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
