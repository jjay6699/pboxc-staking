import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getAccruedPboxc, isClaimable } from "@/lib/rewards";

const BodySchema = z.object({ id: z.string().min(8) });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { id } = parsed.data;
  const p = db.getPositionById(id);
  if (!p) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const claimable = isClaimable(p.start_ts, p.lock_plan);
  if (!claimable) {
    return NextResponse.json({ error: "not_matured" }, { status: 400 });
  }

  const total = getAccruedPboxc(p.amount_sol, p.lock_plan, p.start_ts);
  p.claimed_pboxc = total;
  db.markClaimed(id);
  return NextResponse.json({ position: p, claimed: total });
}