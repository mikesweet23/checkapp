import type { AnswerValues, Assessment, ParticipantDetails, PersonalReport } from "./types";
import { getAdminAssessment } from "./assessment-repository";
import { isDatabaseConfigured } from "./persistence";
import { getPrisma } from "./prisma";
import { buildPersonalReport, pickBand } from "./scoring";

export type StoredAnswer = { questionId: string; prompt: string; answer: string; score: number | null };

export type LoadedAttempt = {
  attemptId: string;
  publicToken?: string;
  assessment: Assessment;
  participant: ParticipantDetails;
  report: PersonalReport;
  answers: StoredAnswer[];
  emailStatus?: string;
  crmSynced: boolean;
  otherAttempts: { id: string; overall: number | null; completedAt: string }[];
};

function answerValue(stored: any): string {
  const value = stored.value && typeof stored.value === "object" ? stored.value as Record<string, unknown> : {};
  if (typeof stored.optionId === "string") return stored.optionId;
  if (typeof value.optionId === "string") return value.optionId;
  if (typeof value.text === "string") return value.text;
  return typeof stored.value === "string" ? stored.value : "";
}

function answerLabel(stored: any, assessment: Assessment): string {
  const value = stored.value && typeof stored.value === "object" ? stored.value as Record<string, unknown> : {};
  if (typeof value.label === "string") return value.label;
  if (typeof value.text === "string") return value.text;
  const question = assessment.questions.find((candidate) => candidate.id === stored.questionId);
  const option = question?.options.find((candidate) => candidate.id === stored.optionId)
    ?? question?.options.find((candidate) => candidate.score === stored.score);
  return option?.label ?? (typeof stored.value === "string" ? stored.value : "—");
}

/** Loads a completed attempt by its private public token or (for admins) by id. */
export async function loadAttempt(where: { publicToken: string } | { id: string }): Promise<LoadedAttempt | null> {
  if (!isDatabaseConfigured()) return null;
  const prisma = getPrisma();
  const attempt = await prisma.assessmentAttempt.findUnique({
    where,
    include: { contact: { include: { crmLink: true } }, answers: { include: { question: true } }, scores: true, emailEvents: { where: { type: "REPORT_EMAIL" }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!attempt || attempt.status !== "COMPLETED" || attempt.overallScore == null) return null;
  const assessment = await getAdminAssessment(attempt.assessmentId);
  if (!assessment || !assessment.resultBands.length) return null;

  const answers: AnswerValues = Object.fromEntries(attempt.answers.map((stored: any) => [stored.questionId, answerValue(stored)]));
  const band = assessment.resultBands.find((candidate) => candidate.id === attempt.resultBandId) ?? pickBand(assessment.resultBands, attempt.overallScore);
  const categoryScores = Object.fromEntries(attempt.scores.map((score: { categoryId: string; score: number }) => [score.categoryId, score.score]));

  const history = attempt.contactId ? await prisma.assessmentAttempt.findMany({
    where: { contactId: attempt.contactId, assessmentId: attempt.assessmentId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    select: { id: true, overallScore: true, completedAt: true, resultBandId: true },
  }) : [];
  const previousRecord = history.find((candidate: any) => candidate.id !== attempt.id && candidate.completedAt && attempt.completedAt && new Date(candidate.completedAt) < new Date(attempt.completedAt));
  const previous = previousRecord?.overallScore != null ? {
    overall: previousRecord.overallScore,
    completedAt: new Date(previousRecord.completedAt).toISOString(),
    bandLabel: assessment.resultBands.find((candidate) => candidate.id === previousRecord.resultBandId)?.label,
  } : undefined;

  const report = buildPersonalReport({ assessment, answers, result: { overall: attempt.overallScore, band, categoryScores }, previous, completedAt: attempt.completedAt ?? undefined });
  const order = new Map(assessment.questions.map((question, index) => [question.id, index]));
  const storedAnswers = [...attempt.answers]
    .sort((a: any, b: any) => (order.get(a.questionId) ?? a.question?.sortOrder ?? 0) - (order.get(b.questionId) ?? b.question?.sortOrder ?? 0))
    .map((stored: any) => ({ questionId: stored.questionId, prompt: stored.question?.prompt ?? "", answer: answerLabel(stored, assessment), score: stored.score ?? null }));

  return {
    attemptId: attempt.id,
    publicToken: attempt.publicToken ?? undefined,
    assessment,
    participant: { firstName: attempt.contact?.firstName ?? "", lastName: attempt.contact?.lastName ?? "", email: attempt.contact?.email ?? "", consent: Boolean(attempt.contact?.consent), followUpConsent: Boolean(attempt.contact?.followUpConsent) },
    report,
    answers: storedAnswers,
    emailStatus: attempt.emailEvents[0]?.status,
    crmSynced: Boolean(attempt.contact?.crmLink),
    otherAttempts: history.filter((candidate: any) => candidate.id !== attempt.id).map((candidate: any) => ({ id: candidate.id, overall: candidate.overallScore, completedAt: new Date(candidate.completedAt).toISOString() })),
  };
}
