import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { getPlanLabel } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestedLimit = Number(new URL(request.url).searchParams.get("limit") ?? 12);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(20, Math.max(1, Math.floor(requestedLimit)))
    : 12;
  const now = Math.floor(Date.now() / 1000);
  const verifiedPositions = await db.listRecentVerifiedPositions(50);
  const positions = verifiedPositions
    .filter((position) =>
      position.status !== "claimed" &&
      position.maturity_ts > now
    )
    .slice(0, limit);

  const items = positions.map((position) => ({
    id: position.id,
    wallet: `${position.wallet_address.slice(0, 4)}…${position.wallet_address.slice(-4)}`,
    amountSol: position.amount_sol,
    plan: getPlanLabel(position.lock_plan),
    multiplier: position.lock_multiplier,
    startedAt: position.start_ts,
    maturityAt: position.maturity_ts,
    status: "active" as const,
  }));

  return NextResponse.json(
    { items, updatedAt: now },
    { headers: { "Cache-Control": "no-store" } },
  );
}
