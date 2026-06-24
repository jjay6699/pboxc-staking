import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { LockPlan, LOCK_MULTIPLIERS } from "@/lib/config";
import { LAMPORTS_PER_SOL, lamportsToSol, verifyDepositSignature } from "@/server/verifyDeposit";

const CreateSchema = z.object({
  wallet_address: z.string().min(32),
  amount_sol: z.number().positive("amount must be > 0"),
  lock_plan: z.custom<LockPlan>().refine((value) => value in LOCK_MULTIPLIERS),
  tx_signature: z.string().min(32),
  cluster: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "wallet is required" }, { status: 400 });
  const items = await db.listPositionsByWallet(wallet);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { wallet_address, amount_sol, lock_plan, tx_signature, cluster } = parsed.data;
  const settings = await db.getSettings();
  if (settings.stakingPaused) {
    return NextResponse.json({ error: "staking_paused" }, { status: 503 });
  }
  if (amount_sol < settings.minDepositSol || amount_sol > settings.maxDepositSol) {
    return NextResponse.json({
      error: "amount_out_of_range",
      min: settings.minDepositSol,
      max: settings.maxDepositSol,
    }, { status: 400 });
  }

  if ((await db.findPositionBySignature(tx_signature)) || (await db.findTxBySignature(tx_signature))) {
    return NextResponse.json({ error: "duplicate_signature" }, { status: 409 });
  }

  const expectedLamports = Math.round(amount_sol * LAMPORTS_PER_SOL);

  let verified;
  try {
    verified = await verifyDepositSignature({
      signature: tx_signature,
      walletAddress: wallet_address,
      expectedLamports,
      cluster,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "verification_failed";
    const status = msg === "transaction_not_found" ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }

  const onChainAmountSol = lamportsToSol(verified.lamports);
  const timestamp = verified.blockTime ?? Math.floor(Date.now() / 1000);

  const pos = await db.createPosition({
    wallet_address,
    amount_sol: onChainAmountSol,
    lock_plan,
    start_ts: timestamp,
    tx_signature,
  });

  await db.addTx({
    wallet_address,
    type: "deposit",
    tx_sig: tx_signature,
    ts: timestamp,
    meta: {
      amount_sol: onChainAmountSol,
      lock_plan,
      lamports: verified.lamports,
      slot: verified.slot,
      cluster: verified.cluster ?? cluster,
    },
  });

  return NextResponse.json({ position: pos, verified_amount: onChainAmountSol, blockTime: timestamp });
} 
