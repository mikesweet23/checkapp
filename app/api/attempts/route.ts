import { NextResponse } from "next/server";
import { calculateResult } from "@/src/lib/seed-data";
import { getAssessmentForPublic } from "@/src/lib/assessment-repository";
import { isDatabaseConfigured, markEmailDelivery, persistAttempt, saveCrmLinkage } from "@/src/lib/persistence";
import { sendResultEmail, syncContactToCrm } from "@/src/lib/services";
import type { ParticipantDetails } from "@/src/lib/types";

export const runtime = "nodejs";

function isParticipant(value: unknown): value is ParticipantDetails {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.firstName === "string" && candidate.firstName.trim().length > 0
    && typeof candidate.lastName === "string" && candidate.lastName.trim().length > 0
    && typeof candidate.email === "string" && candidate.email.includes("@")
    && candidate.consent === true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { slug?: string; participant?: unknown; answers?: Record<string, unknown> };
    const assessment = body.slug ? await getAssessmentForPublic(body.slug) : undefined;
    if (!assessment || !isParticipant(body.participant) || !body.answers) {
      return NextResponse.json({ error: "A valid assessment, participant details and consent are required." }, { status: 400 });
    }

    const answers = Object.fromEntries(Object.entries(body.answers).filter(([, value]) => typeof value === "number" || typeof value === "string")) as Record<string, number | string>;
    if (assessment.questions.some((question) => question.type !== "TEXT" && typeof answers[question.id] !== "number")) {
      return NextResponse.json({ error: "Please answer every question before submitting." }, { status: 400 });
    }

    const result = calculateResult(assessment, answers);
    let saved: { mode: "database" | "demo"; attemptId: string; contactId?: string; databaseError: boolean };
    try {
      saved = await persistAttempt({ assessment, participant: body.participant, answers, result });
    } catch (error) {
      console.error("Could not persist assessment attempt", error);
      if (isDatabaseConfigured() || process.env.NODE_ENV === "production") return NextResponse.json({ error: "We could not save your result. Please try again." }, { status: 503 });
      saved = { mode: "demo", attemptId: `demo-${Date.now()}`, databaseError: true };
    }
    const email = await sendResultEmail({ participant: body.participant, assessment, result });
    try {
      await markEmailDelivery({ attemptId: saved.attemptId, status: email.status === "sent" ? "SENT" : "FAILED", providerId: email.providerId });
    } catch (error) {
      console.error("Could not update email event", error);
    }
    const crm = await syncContactToCrm({ contactId: saved.contactId, attemptId: saved.attemptId, participant: body.participant, assessment, result });
    if (crm.status === "synced" && crm.externalId && saved.contactId) {
      try {
        await saveCrmLinkage({ contactId: saved.contactId, provider: "webhook", externalId: crm.externalId, metadata: { assessmentSlug: assessment.slug } });
      } catch (error) {
        console.error("Could not save CRM linkage", error);
      }
    }
    return NextResponse.json({ ...saved, emailStatus: email.status, pdfStatus: email.pdfStatus, crmStatus: crm.status });
  } catch {
    return NextResponse.json({ error: "We could not save this attempt. Please try again." }, { status: 400 });
  }
}
