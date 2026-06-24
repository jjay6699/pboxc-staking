import { NextResponse } from "next/server";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await db.getSettings();
  return NextResponse.json(
    { settings },
    { headers: { "Cache-Control": "no-store" } },
  );
}
