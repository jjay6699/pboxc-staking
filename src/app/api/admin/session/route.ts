import { NextRequest, NextResponse } from "next/server";
import { adminConfigured, readAdminSession } from "@/server/adminAuth";

export async function GET(request: NextRequest) {
  const session = readAdminSession(request);
  return NextResponse.json({
    configured: adminConfigured(),
    authenticated: Boolean(session),
    username: session?.username ?? null,
  });
}
