import type { Assessment, AttemptResult, ParticipantDetails } from "./types";
import { getPrisma } from "./prisma";

const workspaceId = "workspace-absolute-mind";

export function isDatabaseConfigured() {
  const url = process.env.DATABASE_URL ?? "";
  return Boolean(url && !url.includes("user:password") && !url.includes("localhost"));
}

function assessmentCreateData(assessment: Assessment) {
  return {
    id: assessment.id,
    workspaceId,
    slug: assessment.slug,
    name: assessment.name,
    shortName: assessment.shortName,
    tagline: assessment.tagline,
    description: assessment.description,
    status: assessment.status,
    settings: { brand: "Absolute Mind" },
    categories: {
      create: assessment.categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
      })),
    },
    questions: {
      create: assessment.questions.map((question, index) => ({
        id: question.id,
        prompt: question.prompt,
        helpText: question.helpText,
        categoryId: question.categoryId,
        sortOrder: index,
        options: { create: question.options.map((option) => ({ id: option.id, label: option.label, score: option.score })) },
      })),
    },
    resultBands: {
      create: assessment.resultBands.map((band) => ({
        id: band.id,
        minScore: band.minScore,
        maxScore: band.maxScore,
        label: band.label,
        title: band.title,
        summary: band.summary,
        body: band.body,
        ctaLabel: band.ctaLabel,
        ctaHref: band.ctaHref,
      })),
    },
  };
}

export async function persistAttempt({ assessment, participant, answers, result }: {
  assessment: Assessment;
  participant: ParticipantDetails;
  answers: Record<string, number>;
  result: AttemptResult;
}) {
  if (!isDatabaseConfigured()) {
    return { mode: "demo" as const, attemptId: `demo-${Date.now()}`, databaseError: false };
  }

  const prisma = getPrisma();

  const workspace = await prisma.workspace.upsert({
    where: { id: workspaceId },
    update: { name: "Absolute Mind", slug: "absolute-mind" },
    create: { id: workspaceId, name: "Absolute Mind", slug: "absolute-mind" },
  });

  const dbAssessment = await prisma.assessment.upsert({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: assessment.slug } },
    update: {},
    create: assessmentCreateData(assessment),
  });

  const contact = await prisma.contact.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: participant.email } },
    update: { firstName: participant.firstName, lastName: participant.lastName, consent: participant.consent },
    create: {
      workspaceId: workspace.id,
      email: participant.email,
      firstName: participant.firstName,
      lastName: participant.lastName,
      consent: participant.consent,
    },
  });

  const attempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId: dbAssessment.id,
      contactId: contact.id,
      status: "COMPLETED",
      overallScore: result.overall,
      resultBandId: result.band.id,
      completedAt: new Date(),
      answers: {
        create: assessment.questions.map((question) => ({
          questionId: question.id,
          optionId: question.options.find((option) => option.score === answers[question.id])?.id,
          value: answers[question.id],
          score: answers[question.id],
        })),
      },
      scores: {
        create: assessment.categories.map((category) => ({ categoryId: category.id, score: result.categoryScores[category.id] ?? 0 })),
      },
      emailEvents: {
        create: {
          type: "REPORT_EMAIL",
          status: process.env.RESEND_API_KEY && process.env.REPORT_FROM_EMAIL ? "QUEUED" : "NOT_CONFIGURED",
          payload: { recipient: participant.email, reportBand: result.band.id },
        },
      },
    },
  });

  return {
    mode: "database" as const,
    attemptId: attempt.id,
    databaseError: false,
  };
}
