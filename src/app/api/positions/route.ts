import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { LOCK_MULTIPLIERS, LockPlan } from "@/lib/config";

const CreateSchema = z.object({
  wallet_address: z.string().min(32),
  amount_sol: z.number().positive(),
  lock_plan: z.custom<LockPlan>(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "wallet is required" }, { status: 400 });
  const items = db.listPositionsByWallet(wallet);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { wallet_address, amount_sol, lock_plan } = parsed.data;
  const pos = db.createPosition({ wallet_address, amount_sol, lock_plan });
  return NextResponse.json({ position: pos });
} 