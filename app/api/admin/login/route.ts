import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminAuthConfigured, createAdminSession } from "@/src/lib/admin-auth";

export async function POST(request: Request) {
  if (!adminAuthConfigured()) return NextResponse.json({ error: "Admin login has not been configured yet." }, { status: 503 });
  const body = await request.json() as { email?: string; password?: string };
  if (body.email?.trim().toLowerCase() !== process.env.ADMIN_EMAIL?.trim().toLowerCase() || body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Those details did not match." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await createAdminSession(process.env.ADMIN_EMAIL!), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  return response;
}
