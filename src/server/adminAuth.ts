import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "pboxc_admin_session";
const SESSION_SECONDS = 8 * 60 * 60;

type SessionPayload = {
  username: string;
  expiresAt: number;
};

export function adminConfigured() {
  return Boolean(
    process.env.ADMIN_USERNAME &&
    process.env.ADMIN_PASSWORD &&
    process.env.ADMIN_SESSION_SECRET
  );
}

export function validateAdminCredentials(username: string, password: string) {
  const expectedUsername = process.env.ADMIN_USERNAME ?? "";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  return safeEqual(username, expectedUsername) && safeEqual(password, expectedPassword);
}

export function createAdminSession(username: string) {
  const payload: SessionPayload = {
    username,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function readAdminSession(request: NextRequest): SessionPayload | null {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || !safeEqual(signature, sign(encoded))) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.username || payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}

function sign(value: string) {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "not-configured")
    .update(value)
    .digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
