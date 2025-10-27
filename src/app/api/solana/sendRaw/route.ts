import { NextRequest, NextResponse } from "next/server";
import { sendRawTransactionBase64 } from "@/server/solanaRpc";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const txn = json?.transaction;
  if (typeof txn !== "string" || txn.length === 0) {
    return NextResponse.json({ error: "transaction_required" }, { status: 400 });
  }
  const cluster = typeof json?.cluster === "string" ? json.cluster : undefined;
  try {
    const result = await sendRawTransactionBase64(txn, cluster);
    return NextResponse.json({
      signature: result.signature,
      endpoint: result.endpoint,
      cluster: result.cluster,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "send_failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
