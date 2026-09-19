import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminAuthConfigured, authenticateAdmin, createAdminSession } from "@/src/lib/admin-auth";

export async function POST(request: Request) {
  if (!adminAuthConfigured()) return NextResponse.json({ error: "Admin login has not been configured yet." }, { status: 503 });
  const body = await request.json() as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!authenticateAdmin(email, body.password ?? "")) {
    return NextResponse.json({ error: "Those details did not match." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await createAdminSession(email), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  return response;
}
