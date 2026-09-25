import { NextResponse } from "next/server";
import { calculateResult, buildPersonalReport, isScorable } from "@/src/lib/scoring";
import { getAssessmentForPublic } from "@/src/lib/assessment-repository";
import { countRecentAttemptsForEmail, isDatabaseConfigured, markEmailDelivery, persistAttempt, saveCrmLinkage } from "@/src/lib/persistence";
import { clientIp, rateLimit } from "@/src/lib/rate-limit";
import { sendAdminNotification, sendResultEmail, syncContactToCrm } from "@/src/lib/services";
import type { AnswerValues, Assessment, ParticipantDetails } from "@/src/lib/types";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function participantFrom(value: unknown): ParticipantDetails | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const text = (field: unknown) => typeof field === "string" ? field.trim().slice(0, 120) : "";
  const participant = {
    firstName: text(candidate.firstName),
    lastName: text(candidate.lastName),
    email: text(candidate.email).toLowerCase(),
    consent: candidate.consent === true,
    followUpConsent: candidate.followUpConsent === true,
  };
  return participant.firstName && participant.lastName && EMAIL_PATTERN.test(participant.email) && participant.consent ? participant : null;
}

/** Keeps only answers that belong to this assessment, and checks every required question is answered. */
function validAnswers(assessment: Assessment, raw: Record<string, unknown>): AnswerValues | null {
  const answers: AnswerValues = {};
  for (const question of assessment.questions) {
    const value = raw[question.id];
    if (isScorable(question)) {
      if (typeof value !== "string" || !question.options.some((option) => option.id === value)) return null;
      answers[question.id] = value;
    } else {
      const text = typeof value === "string" ? value.trim().slice(0, MAX_TEXT_LENGTH) : "";
      if (!text && !question.optional) return null;
      answers[question.id] = text;
    }
  }
  return answers;
}

function baseUrl(request: Request) {
  return (process.env.PUBLIC_BASE_URL || new URL(request.url).origin).replace(/\/$/, "");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { slug?: string; participant?: unknown; answers?: Record<string, unknown>; website?: string } | null;
  if (!body) return NextResponse.json({ error: "We could not read this submission. Please try again." }, { status: 400 });
  // Honeypot: real people never see or fill this field.
  if (body.website) return NextResponse.json({ error: "We could not save this attempt." }, { status: 400 });

  const limit = rateLimit(`attempt:${clientIp(request)}`, 10, 60 * 60 * 1000);
  if (!limit.ok) return NextResponse.json({ error: "You have completed several check-ins in a short time. Please try again a little later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });

  const assessment = body.slug ? await getAssessmentForPublic(body.slug) : undefined;
  const participant = participantFrom(body.participant);
  if (!assessment || assessment.status !== "LIVE" || !participant || !body.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "A valid assessment, participant details and consent are required." }, { status: 400 });
  }
  const answers = validAnswers(assessment, body.answers);
  if (!answers) return NextResponse.json({ error: "Please answer every question before submitting." }, { status: 400 });

  try {
    if (await countRecentAttemptsForEmail(participant.email, new Date(Date.now() - 60 * 60 * 1000)) >= 5) {
      return NextResponse.json({ error: "This email address has completed several check-ins in the last hour. Please try again later." }, { status: 429 });
    }
  } catch (error) {
    console.error("Could not check recent attempts", error);
  }

  const result = calculateResult(assessment, answers);
  let saved: Awaited<ReturnType<typeof persistAttempt>>;
  try {
    saved = await persistAttempt({ assessment, participant, answers, result });
  } catch (error) {
    console.error("Could not persist assessment attempt", error);
    if (isDatabaseConfigured() || process.env.NODE_ENV === "production") return NextResponse.json({ error: "We could not save your result. Please try again." }, { status: 503 });
    saved = { mode: "demo", attemptId: `demo-${Date.now()}`, completedAt: new Date(), databaseError: true };
  }

  const report = buildPersonalReport({ assessment, answers, result, previous: saved.previous, completedAt: saved.completedAt });
  const origin = baseUrl(request);
  const resultsUrl = saved.publicToken ? `${origin}/results/${saved.publicToken}` : undefined;

  const email = await sendResultEmail({ participant, assessment, report, resultsUrl });
  try {
    await markEmailDelivery({ attemptId: saved.attemptId, status: email.status === "sent" ? "SENT" : email.status === "failed" ? "FAILED" : "NOT_CONFIGURED", providerId: "providerId" in email ? email.providerId : undefined });
  } catch (error) {
    console.error("Could not update email event", error);
  }

  await sendAdminNotification({ participant, assessment, report, adminUrl: saved.mode === "database" ? `${origin}/admin/reports/${saved.attemptId}` : undefined });

  const crm = await syncContactToCrm({ contactId: saved.contactId, attemptId: saved.attemptId, participant, assessment, result });
  if (crm.status === "synced" && crm.externalId && saved.contactId) {
    try {
      await saveCrmLinkage({ contactId: saved.contactId, provider: "webhook", externalId: crm.externalId, metadata: { assessmentSlug: assessment.slug } });
    } catch (error) {
      console.error("Could not save CRM linkage", error);
    }
  }

  return NextResponse.json({
    attemptId: saved.attemptId,
    mode: saved.mode,
    publicToken: saved.publicToken,
    databaseError: saved.databaseError,
    emailStatus: email.status,
    pdfStatus: "pdfStatus" in email ? email.pdfStatus : undefined,
    crmStatus: crm.status,
    report,
  });
}
