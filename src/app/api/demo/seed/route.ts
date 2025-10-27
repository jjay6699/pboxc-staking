import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";

const BodySchema = z.object({
  wallet_address: z.string().min(32),
  amount_sol: z.number().positive().default(5),
  daysAgo: z.number().int().min(0).max(13).default(0),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { wallet_address, amount_sol, daysAgo } = parsed.data;
  const start_ts = Math.floor(Date.now() / 1000) - daysAgo * 86400;
  const position = db.createPosition({ wallet_address, amount_sol, lock_plan: "1m", start_ts });
  return NextResponse.json({ position });
}


