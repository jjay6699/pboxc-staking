import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { LOCK_MULTIPLIERS, LockPlan } from "@/lib/config";

const MAX_DEPOSIT_SOL = 1000;

const CreateSchema = z.object({
  wallet_address: z.string().min(32),
  amount_sol: z
    .number()
    .positive("amount must be > 0")
    .max(MAX_DEPOSIT_SOL, `amount must be <= ${MAX_DEPOSIT_SOL}`),
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
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.DEMO_MODE === "true";
  const headerKey = req.headers.get("x-demo-key");
  const requiredKey = process.env.DEMO_KEY;
  if (!demoMode || (requiredKey && headerKey !== requiredKey)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { wallet_address, amount_sol, lock_plan } = parsed.data;
  const pos = db.createPosition({ wallet_address, amount_sol, lock_plan });
  return NextResponse.json({ position: pos });
} 