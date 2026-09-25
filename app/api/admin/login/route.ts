import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminAuthConfigured, authenticateAdmin, createAdminSession } from "@/src/lib/admin-auth";
import { clientIp, rateLimit } from "@/src/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!adminAuthConfigured()) return NextResponse.json({ error: "Admin login has not been configured yet." }, { status: 503 });
  const body = await request.json().catch(() => ({})) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const limit = rateLimit(`login:${clientIp(request)}`, 8, 15 * 60 * 1000);
  if (!limit.ok) return NextResponse.json({ error: "Too many sign-in attempts. Please wait a few minutes and try again." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  if (!authenticateAdmin(email, body.password ?? "")) {
    return NextResponse.json({ error: "Those details did not match." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await createAdminSession(email), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  return response;
}
