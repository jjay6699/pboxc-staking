import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE_NAME,
  adminConfigured,
  adminCookieOptions,
  createAdminSession,
  validateAdminCredentials,
} from "@/server/adminAuth";

const LoginSchema = z.object({
  username: z.string().min(1).max(128),
  password: z.string().min(1).max(256),
});

export async function POST(request: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }
  const parsed = LoginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !validateAdminCredentials(parsed.data.username, parsed.data.password)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, username: parsed.data.username });
  response.cookies.set(
    ADMIN_COOKIE_NAME,
    createAdminSession(parsed.data.username),
    adminCookieOptions(),
  );
  return response;
}
