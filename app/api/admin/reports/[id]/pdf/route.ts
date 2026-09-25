import { NextResponse } from "next/server";
import { isAdminRequest } from "@/src/lib/admin-auth";
import { loadAttempt } from "@/src/lib/attempt-report";
import { isDatabaseConfigured } from "@/src/lib/persistence";
import { createPdfReport, reportFilename } from "@/src/lib/pdf-report";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminRequest()) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "The assessment database is not configured." }, { status: 503 });
  const { id } = await params;
  const attempt = await loadAttempt({ id });
  if (!attempt) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  const origin = (process.env.PUBLIC_BASE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const bytes = await createPdfReport({ participant: attempt.participant, assessment: attempt.assessment, report: attempt.report, resultsUrl: attempt.publicToken ? `${origin}/results/${attempt.publicToken}` : undefined });
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${reportFilename(attempt.assessment, attempt.participant)}"`, "Cache-Control": "private, no-store" } });
}
