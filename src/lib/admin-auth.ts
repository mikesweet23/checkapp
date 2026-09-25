import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "absolute_mind_admin_session";

export function configuredAdminEmails() {
  return Array.from(new Set([
    process.env.ADMIN_EMAIL,
    ...(process.env.ADMIN_ADDITIONAL_EMAILS ?? "").split(","),
    ...(process.env.ADMIN_EMAILS ?? "").split(","),
  ].map((email) => email?.trim().toLowerCase()).filter(Boolean))) as string[];
}

export function adminAuthConfigured() {
  return Boolean(configuredAdminEmails().length && process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

export function isConfiguredAdminEmail(email: string) {
  return configuredAdminEmails().includes(email.trim().toLowerCase());
}

/** Constant-time comparison so response timing does not reveal how much of a secret matched. */
export function safeEqual(a: string, b: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

export function authenticateAdmin(email: string, password: string) {
  if (!adminAuthConfigured()) return false;
  const passwordMatches = safeEqual(password, process.env.ADMIN_PASSWORD ?? "");
  return isConfiguredAdminEmail(email) && passwordMatches;
}

function toBase64Url(value: Uint8Array) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

async function sign(value: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

export async function createAdminSession(email: string) {
  const payload = `${email}|${Date.now() + 1000 * 60 * 60 * 8}`;
  return `${toBase64Url(new TextEncoder().encode(payload))}.${await sign(payload)}`;
}

export async function verifyAdminSession(token?: string) {
  if (!token || !adminAuthConfigured()) return false;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;
  const payload = new TextDecoder().decode(fromBase64Url(encodedPayload));
  const [email, expiresAt] = payload.split("|");
  if (!email || !isConfiguredAdminEmail(email) || Number(expiresAt) < Date.now()) return false;
  const expected = await sign(payload);
  return safeEqual(expected, signature);
}

export async function isAdminRequest() {
  if (!adminAuthConfigured()) return false;
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function requireAdmin() {
  if (!adminAuthConfigured()) redirect("/admin/login");
  const cookieStore = await cookies();
  const isValid = await verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!isValid) redirect("/admin/login");
}
