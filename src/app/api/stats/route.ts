import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  const s = db.stats();
  return NextResponse.json(s);
}

