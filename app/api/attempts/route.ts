import { NextResponse } from "next/server";
import { getAssessment, calculateResult } from "@/src/lib/seed-data";
import { persistAttempt } from "@/src/lib/persistence";
import { sendResultEmail } from "@/src/lib/services";
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
    let saved: { mode: "database" | "demo"; attemptId: string; databaseError: boolean };
    try {
      saved = await persistAttempt({ assessment, participant: body.participant, answers, result });
    } catch (error) {
      console.error("Could not persist assessment attempt", error);
      saved = { mode: "demo", attemptId: `demo-${Date.now()}`, databaseError: true };
    }
    const email = await sendResultEmail({ participant: body.participant, assessment, result });
    return NextResponse.json({ ...saved, emailStatus: email.status });
  } catch {
    return NextResponse.json({ error: "We could not save this attempt. Please try again." }, { status: 400 });
  }
}
