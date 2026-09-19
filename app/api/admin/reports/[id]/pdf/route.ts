import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/admin-auth";
import { getAdminAssessment } from "@/src/lib/assessment-repository";
import { isDatabaseConfigured } from "@/src/lib/persistence";
import { getPrisma } from "@/src/lib/prisma";
import { createPdfReport } from "@/src/lib/pdf-report";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "The assessment database is not configured." }, { status: 503 });
  const { id } = await params;
  const attempt = await getPrisma().assessmentAttempt.findUnique({ where: { id }, include: { contact: true, assessment: true, scores: true } });
  if (!attempt?.contact || attempt.overallScore == null || !attempt.resultBandId) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  const assessment = await getAdminAssessment(attempt.assessmentId);
  const band = assessment?.resultBands.find((candidate) => candidate.id === attempt.resultBandId);
  if (!assessment || !band) return NextResponse.json({ error: "Assessment content not found." }, { status: 404 });
  const bytes = await createPdfReport({ participant: { firstName: attempt.contact.firstName ?? "", lastName: attempt.contact.lastName ?? "", email: attempt.contact.email, consent: attempt.contact.consent }, assessment, result: { overall: attempt.overallScore, band, categoryScores: Object.fromEntries((attempt.scores as Array<{ categoryId: string; score: number }>).map((score) => [score.categoryId, score.score])) } });
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${assessment.slug}-report.pdf"` } });
}
