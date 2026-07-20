import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getAccruedCrex, isClaimable } from "@/lib/rewards";

const BodySchema = z.object({
  id: z.string().min(8),
  wallet_address: z.string().min(32),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { id, wallet_address } = parsed.data;
  const position = await db.getPositionById(id);
  if (!position) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (position.wallet_address !== wallet_address) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const claimable = isClaimable(position.start_ts, position.lock_plan);
  if (!claimable) {
    return NextResponse.json({ error: "not_matured" }, { status: 400 });
  }

  const settings = await db.getSettings();
  const total = getAccruedCrex(
    position.amount_sol,
    position.lock_plan,
    position.start_ts,
    undefined,
    position.lock_multiplier,
    settings.baseRate,
  );
  const updated = await db.markClaimed(id, total);
  const responsePosition = updated ?? { ...position, claimed_pboxc: total, status: "claimed" };
  return NextResponse.json({ position: responsePosition, claimed: total });
}
