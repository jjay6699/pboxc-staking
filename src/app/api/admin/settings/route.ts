import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readAdminSession } from "@/server/adminAuth";
import { db } from "@/server/db";

const SettingsSchema = z.object({
  baseRate: z.number().positive().max(1_000_000),
  minDepositSol: z.number().positive().max(1_000_000),
  maxDepositSol: z.number().positive().max(1_000_000),
  stakingPaused: z.boolean(),
  multipliers: z.object({
    "1m": z.number().positive().max(100),
    "3m": z.number().positive().max(100),
    "6m": z.number().positive().max(100),
    "12m": z.number().positive().max(100),
  }),
}).refine((value) => value.maxDepositSol >= value.minDepositSol, {
  message: "Maximum deposit must be greater than or equal to minimum deposit.",
  path: ["maxDepositSol"],
});

function unauthorized(request: NextRequest) {
  return !readAdminSession(request);
}

export async function GET(request: NextRequest) {
  if (unauthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [settings, stats] = await Promise.all([db.getSettings(), db.stats()]);
  return NextResponse.json({ settings, stats });
}

export async function PUT(request: NextRequest) {
  if (unauthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = SettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const settings = await db.updateSettings({
    ...parsed.data,
    updatedAt: Math.floor(Date.now() / 1000),
  });
  return NextResponse.json({ settings });
}
