import { NextResponse } from "next/server";
import { db } from "@/server/db";

let demoDaysOffset = 0;

export async function POST() {
  demoDaysOffset += 1;
  return NextResponse.json({ ok: true, demoDaysOffset });
}

export function getDemoNow(): number {
  return Math.floor(Date.now() / 1000) + demoDaysOffset * 86400;
}

