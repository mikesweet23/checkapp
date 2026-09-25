import { randomBytes } from "node:crypto";
import type { AnswerValues, Assessment, AttemptResult, ParticipantDetails, PreviousAttempt } from "./types";
import { getPrisma } from "./prisma";
import { chosenOption } from "./scoring";

export const workspaceId = "workspace-absolute-mind";

export function isDatabaseConfigured() {
  const url = process.env.DATABASE_URL ?? "";
  return Boolean(url && !url.includes("user:password"));
}

export function categoryContent(category: Assessment["categories"][number]) {
  return { insights: category.insights ?? null };
}

export function optionMetadata(option: Assessment["questions"][number]["options"][number]) {
  return option.insight?.trim() ? { insight: option.insight.trim() } : undefined;
}

export function bandContent(band: Assessment["resultBands"][number]) {
  return {
    videoTitle: band.videoTitle,
    videoDescription: band.videoDescription,
    videoUrl: band.videoUrl ?? "",
    needsSupport: Boolean(band.needsSupport),
    pdf: band.pdf ?? {},
  };
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
    settings: { brand: "Absolute Mind", completionMinutes: assessment.completionMinutes, signOff: assessment.signOff ?? null },
    categories: {
      create: assessment.categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        content: categoryContent(category),
      })),
    },
    questions: {
      create: assessment.questions.map((question, index) => ({
        id: question.id,
        prompt: question.prompt,
        helpText: question.helpText,
        categoryId: question.categoryId,
        type: question.type === "TEXT" && question.optional ? "TEXT_OPTIONAL" : question.type ?? "SINGLE_CHOICE",
        sortOrder: index,
        options: { create: question.options.map((option) => ({ id: option.id, label: option.label, score: option.score, metadata: optionMetadata(option) })) },
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
        content: { create: { content: bandContent(band) } },
      })),
    },
  };
}

export function createPublicToken() {
  return randomBytes(24).toString("base64url");
}

export async function countRecentAttemptsForEmail(email: string, since: Date) {
  if (!isDatabaseConfigured()) return 0;
  return getPrisma().assessmentAttempt.count({ where: { completedAt: { gte: since }, contact: { workspaceId, email } } });
}

export async function persistAttempt({ assessment, participant, answers, result }: {
  assessment: Assessment;
  participant: ParticipantDetails;
  answers: AnswerValues;
  result: AttemptResult;
}): Promise<{ mode: "database" | "demo"; attemptId: string; contactId?: string; publicToken?: string; previous?: PreviousAttempt; completedAt: Date; databaseError: boolean }> {
  const completedAt = new Date();
  if (!isDatabaseConfigured()) {
    return { mode: "demo", attemptId: `demo-${Date.now()}`, completedAt, databaseError: false };
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
    update: { firstName: participant.firstName, lastName: participant.lastName, consent: participant.consent, followUpConsent: Boolean(participant.followUpConsent), consentedAt: completedAt },
    create: {
      workspaceId: workspace.id,
      email: participant.email,
      firstName: participant.firstName,
      lastName: participant.lastName,
      consent: participant.consent,
      followUpConsent: Boolean(participant.followUpConsent),
      consentedAt: completedAt,
    },
  });

  const previousAttempt = await prisma.assessmentAttempt.findFirst({
    where: { contactId: contact.id, assessmentId: dbAssessment.id, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    select: { overallScore: true, completedAt: true, resultBandId: true },
  });

  const publicToken = createPublicToken();
  const attempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId: dbAssessment.id,
      contactId: contact.id,
      status: "COMPLETED",
      publicToken,
      overallScore: result.overall,
      resultBandId: result.band.id,
      completedAt,
      answers: {
        create: assessment.questions.map((question) => {
          const option = chosenOption(question, answers);
          // Keep a snapshot of the answer so history survives later edits to the assessment.
          return {
            questionId: question.id,
            optionId: option?.id,
            value: option ? { optionId: option.id, label: option.label, score: option.score } : { text: answers[question.id] ?? "" },
            score: option?.score ?? null,
          };
        }),
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

  const previous = previousAttempt?.overallScore != null && previousAttempt.completedAt
    ? { overall: previousAttempt.overallScore, completedAt: new Date(previousAttempt.completedAt).toISOString(), bandLabel: assessment.resultBands.find((band) => band.id === previousAttempt.resultBandId)?.label }
    : undefined;

  return { mode: "database", attemptId: attempt.id, contactId: contact.id, publicToken, previous, completedAt, databaseError: false };
}

export async function markEmailDelivery({ attemptId, status, providerId }: { attemptId: string; status: "SENT" | "FAILED" | "NOT_CONFIGURED"; providerId?: string }) {
  if (!isDatabaseConfigured() || attemptId.startsWith("demo-")) return;
  const prisma = getPrisma();
  await prisma.emailEvent.updateMany?.({ where: { attemptId, type: "REPORT_EMAIL" }, data: { status, providerId } });
}

export async function saveCrmLinkage({ contactId, provider, externalId, metadata }: { contactId: string; provider: string; externalId: string; metadata?: object }) {
  if (!isDatabaseConfigured()) return;
  const prisma = getPrisma();
  await prisma.crmLinkage.upsert({
    where: { contactId },
    update: { provider, externalId, metadata, syncedAt: new Date() },
    create: { contactId, provider, externalId, metadata, syncedAt: new Date() },
  });
}

/** Erases a contact and everything they submitted (answers, scores, email events and CRM link). */
export async function deleteContactData(contactId: string) {
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const attempts = await tx.assessmentAttempt.deleteMany({ where: { contactId } });
    await tx.contact.deleteMany({ where: { id: contactId, workspaceId } });
    return { attemptsDeleted: attempts?.count ?? 0 };
  });
}

/** Removes attempts older than the retention period, then contacts left with no attempts. */
export async function purgeExpiredData(cutoff: Date) {
  const prisma = getPrisma();
  const attempts = await prisma.assessmentAttempt.deleteMany({ where: { OR: [{ completedAt: { lt: cutoff } }, { completedAt: null, startedAt: { lt: cutoff } }] } });
  const contacts = await prisma.contact.deleteMany({ where: { workspaceId, createdAt: { lt: cutoff }, attempts: { none: {} } } });
  return { attemptsDeleted: attempts?.count ?? 0, contactsDeleted: contacts?.count ?? 0 };
}
