import { NextResponse } from "next/server";
import { getAssessment, calculateResult } from "@/src/lib/seed-data";
import { persistAttempt } from "@/src/lib/persistence";
import type { ParticipantDetails } from "@/src/lib/types";

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
    const assessment = body.slug ? getAssessment(body.slug) : undefined;
    if (!assessment || !isParticipant(body.participant) || !body.answers) {
      return NextResponse.json({ error: "A valid assessment, participant details and consent are required." }, { status: 400 });
    }

    const answers = Object.fromEntries(Object.entries(body.answers).filter(([, value]) => typeof value === "number")) as Record<string, number>;
    if (assessment.questions.some((question) => answers[question.id] === undefined)) {
      return NextResponse.json({ error: "Please answer every question before submitting." }, { status: 400 });
    }

    const result = calculateResult(assessment, answers);
    try {
      const saved = await persistAttempt({ assessment, participant: body.participant, answers, result });
      return NextResponse.json({ ...saved, emailStatus: process.env.RESEND_API_KEY && process.env.REPORT_FROM_EMAIL ? "queued" : "not-configured" });
    } catch (error) {
      console.error("Could not persist assessment attempt", error);
      return NextResponse.json({ mode: "demo", attemptId: `demo-${Date.now()}`, databaseError: true, emailStatus: "not-configured" });
    }
  } catch {
    return NextResponse.json({ error: "We could not save this attempt. Please try again." }, { status: 400 });
  }
}
