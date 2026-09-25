import { NextResponse } from "next/server";
import { safeEqual } from "@/src/lib/admin-auth";
import { isDatabaseConfigured, purgeExpiredData } from "@/src/lib/persistence";
import { retentionMonths } from "@/src/lib/support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Deletes results older than DATA_RETENTION_MONTHS. Vercel Cron calls this daily with CRON_SECRET. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !safeEqual(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ ok: true, skipped: "database not configured" });
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - retentionMonths());
  const result = await purgeExpiredData(cutoff);
  return NextResponse.json({ ok: true, cutoff: cutoff.toISOString(), ...result });
}
