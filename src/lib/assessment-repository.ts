import type { Assessment, AssessmentDraft, CategoryInsights, ResultBand, SignOff } from "./types";
import { defaultSignOff, getAssessment as getSeedAssessment, assessments as seedAssessments } from "./seed-data";
import { getPrisma } from "./prisma";
import { bandContent, categoryContent, isDatabaseConfigured, optionMetadata, workspaceId } from "./persistence";

const assessmentInclude = {
  categories: true,
  questions: { include: { options: true }, orderBy: { sortOrder: "asc" as const } },
  resultBands: { include: { content: true }, orderBy: { minScore: "asc" as const } },
  videos: true,
  pdfTemplates: true,
  attempts: { select: { id: true, completedAt: true } },
};

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function jsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function insightsValue(value: unknown): CategoryInsights | undefined {
  const insights = jsonObject(value);
  if (!Object.keys(insights).length) return undefined;
  return { low: stringValue(insights.low), medium: stringValue(insights.medium), high: stringValue(insights.high) };
}

function signOffValue(value: unknown): SignOff {
  const signOff = jsonObject(value);
  return { name: stringValue(signOff.name, defaultSignOff.name), message: stringValue(signOff.message, defaultSignOff.message) };
}

function mapDbAssessment(record: any): Assessment {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    shortName: record.shortName,
    tagline: record.tagline ?? "",
    description: record.description ?? "",
    status: record.status === "LIVE" || record.status === "ARCHIVED" ? record.status : "DRAFT",
    questionCount: record.questions.length,
    completionMinutes: Number(jsonObject(record.settings).completionMinutes ?? 3),
    completions: record.attempts?.filter((attempt: any) => attempt.completedAt).length ?? 0,
    conversionRate: 0,
    updatedAt: new Date(record.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    signOff: signOffValue(jsonObject(record.settings).signOff),
    categories: record.categories.map((category: any) => ({
      id: category.id,
      name: category.name,
      description: category.description ?? "",
      color: category.color ?? "#3d8bd9",
      insights: insightsValue(jsonObject(category.content).insights),
    })),
    questions: record.questions.map((question: any) => ({
      id: question.id,
      prompt: question.prompt,
      helpText: question.helpText ?? undefined,
      categoryId: question.categoryId ?? undefined,
      type: question.type === "SCALE" ? "SCALE" : question.type === "TEXT" || question.type === "TEXT_OPTIONAL" ? "TEXT" : "SINGLE_CHOICE",
      optional: question.type === "TEXT_OPTIONAL",
      options: question.options.map((option: any) => ({ id: option.id, label: option.label, score: option.score, insight: stringValue(jsonObject(option.metadata).insight) || undefined })),
    })),
    resultBands: record.resultBands.map((band: any) => {
      const content = jsonObject(band.content?.content);
      const pdf = jsonObject(content.pdf);
      return {
        id: band.id,
        minScore: band.minScore,
        maxScore: band.maxScore,
        label: band.label,
        title: band.title,
        summary: band.summary ?? "",
        body: band.body ?? "",
        ctaLabel: band.ctaLabel ?? "Learn more",
        ctaHref: band.ctaHref ?? "https://absolutemind.co.uk/",
        videoTitle: stringValue(content.videoTitle, band.title),
        videoDescription: stringValue(content.videoDescription, band.body ?? ""),
        videoUrl: stringValue(content.videoUrl),
        needsSupport: typeof content.needsSupport === "boolean" ? content.needsSupport : undefined,
        pdf: {
          heading: stringValue(pdf.heading, "PERSONALISED REPORT"),
          introduction: stringValue(pdf.introduction, "A thoughtful snapshot of the patterns behind your answers, with a clear next step to consider."),
          nextStep: stringValue(pdf.nextStep),
          note: stringValue(pdf.note, "You do not need to wait until things feel unbearable before asking for support."),
        },
      } satisfies ResultBand;
    }),
  };
}

async function findDbAssessmentBySlug(slug: string) {
  if (!isDatabaseConfigured()) return null;
  try {
    return await getPrisma().assessment.findFirst({ where: { workspaceId, slug }, include: assessmentInclude });
  } catch (error) {
    console.error("Could not load assessment from the database", error);
    return null;
  }
}

export async function getAssessmentForPublic(slug: string) {
  const record = await findDbAssessmentBySlug(slug);
  if (record) return mapDbAssessment(record);
  return getSeedAssessment(slug);
}

export async function listAssessments() {
  if (!isDatabaseConfigured()) return seedAssessments;
  try {
    const records = await getPrisma().assessment.findMany({ where: { workspaceId }, include: assessmentInclude, orderBy: { updatedAt: "desc" } });
    const databaseAssessments = records.map(mapDbAssessment);
    const knownSlugs = new Set(databaseAssessments.map((assessment) => assessment.slug));
    return [...databaseAssessments, ...seedAssessments.filter((assessment) => !knownSlugs.has(assessment.slug))];
  } catch (error) {
    console.error("Could not list assessments from the database", error);
    return seedAssessments;
  }
}

export async function getAdminAssessment(idOrSlug: string) {
  if (isDatabaseConfigured()) {
    try {
      const record = await getPrisma().assessment.findFirst({ where: { workspaceId, OR: [{ id: idOrSlug }, { slug: idOrSlug }] }, include: assessmentInclude });
      if (record) return mapDbAssessment(record);
    } catch (error) {
      console.error("Could not load admin assessment", error);
    }
  }
  return seedAssessments.find((assessment) => assessment.id === idOrSlug || assessment.slug === idOrSlug);
}

export async function saveAssessmentDraft(draft: AssessmentDraft) {
  if (!isDatabaseConfigured()) throw new Error("The assessment database is not configured.");
  const prisma = getPrisma();
  const existing = draft.id ? await prisma.assessment.findFirst({ where: { workspaceId, id: draft.id } }) : await prisma.assessment.findFirst({ where: { workspaceId, slug: draft.slug } });
  const data = {
    name: draft.name.trim(),
    shortName: draft.shortName.trim() || draft.name.trim(),
    slug: draft.slug.trim().toLowerCase(),
    tagline: draft.tagline.trim(),
    description: draft.description.trim(),
    status: draft.status,
    settings: { brand: "Absolute Mind", completionMinutes: draft.completionMinutes, signOff: draft.signOff ?? defaultSignOff },
  };
  const result = await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.upsert({ where: { id: workspaceId }, update: { name: "Absolute Mind", slug: "absolute-mind" }, create: { id: workspaceId, name: "Absolute Mind", slug: "absolute-mind" } });
    const assessment = existing
      ? await tx.assessment.update({ where: { id: existing.id }, data })
      : await tx.assessment.create({ data: { ...data, workspaceId: workspace.id } });

    const categories = draft.categories.filter((category) => category.name.trim());
    const hasAttempts = existing ? (await tx.assessmentAttempt.findMany({ where: { assessmentId: assessment.id }, select: { id: true }, take: 1 })).length > 0 : false;
    if (existing && !hasAttempts) {
      await tx.resultBand.deleteMany({ where: { assessmentId: assessment.id } });
      await tx.question.deleteMany({ where: { assessmentId: assessment.id } });
      await tx.scoreCategory.deleteMany({ where: { assessmentId: assessment.id } });
      await tx.assessmentSection.deleteMany({ where: { assessmentId: assessment.id } });
    }
    if (existing && hasAttempts) {
      for (const category of categories) {
        await tx.scoreCategory.upsert({ where: { id: category.id }, update: { name: category.name.trim(), description: category.description ?? "", color: category.color || "#3d8bd9", content: categoryContent(category) }, create: { id: category.id, assessmentId: assessment.id, name: category.name.trim(), description: category.description ?? "", color: category.color || "#3d8bd9", content: categoryContent(category) } });
      }
    } else {
      await tx.scoreCategory.createMany({ data: categories.map((category) => ({ id: category.id, assessmentId: assessment.id, name: category.name.trim(), description: category.description ?? "", color: category.color || "#3d8bd9", content: categoryContent(category) })) });
    }
    const categoryIds = new Set(categories.map((category) => category.id));
    for (const [index, question] of draft.questions.entries()) {
      const questionData = {
        id: question.id,
        assessmentId: assessment.id,
        prompt: question.prompt.trim(),
        helpText: question.helpText?.trim() || null,
        categoryId: question.categoryId && categoryIds.has(question.categoryId) ? question.categoryId : null,
        type: question.type === "TEXT" && question.optional ? "TEXT_OPTIONAL" : question.type ?? "SINGLE_CHOICE",
        sortOrder: index,
      };
      if (existing && hasAttempts) {
        const { id: _questionId, assessmentId: _questionAssessmentId, ...questionUpdateData } = questionData;
        await tx.question.upsert({ where: { id: question.id }, update: questionUpdateData, create: questionData });
        // Update options in place so past answers keep their link to the option they chose.
        const options = question.type === "TEXT" ? [] : question.options;
        await tx.answerOption.deleteMany({ where: { questionId: question.id, id: { notIn: options.map((option) => option.id) } } });
        for (const option of options) {
          const optionData = { label: option.label.trim(), score: Number(option.score) || 0, metadata: optionMetadata(option) ?? {} };
          await tx.answerOption.upsert({ where: { id: option.id }, update: optionData, create: { id: option.id, questionId: question.id, ...optionData } });
        }
      } else {
        const created = await tx.question.create({ data: { ...questionData, options: question.type === "TEXT" ? undefined : { create: question.options.map((option) => ({ id: option.id, label: option.label.trim(), score: Number(option.score) || 0, metadata: optionMetadata(option) })) } } });
        if (!created) throw new Error("Could not save question");
      }
    }
    for (const band of draft.resultBands) {
      const bandData = { assessmentId: assessment.id, minScore: Number(band.minScore), maxScore: Number(band.maxScore), label: band.label.trim(), title: band.title.trim(), summary: band.summary.trim(), body: band.body.trim(), ctaLabel: band.ctaLabel.trim(), ctaHref: band.ctaHref.trim() };
      if (existing && hasAttempts) {
        const { assessmentId: _bandAssessmentId, ...bandUpdateData } = bandData;
        await tx.resultBand.upsert({ where: { id: band.id }, update: bandUpdateData, create: { id: band.id, ...bandData, content: { create: { content: bandContent(band) } } } });
        await tx.resultBand.update({ where: { id: band.id }, data: { content: { upsert: { create: { content: bandContent(band) }, update: { content: bandContent(band) } } } } });
      } else {
        const created = await tx.resultBand.create({ data: { id: band.id, ...bandData, content: { create: { content: bandContent(band) } } } });
        if (!created) throw new Error("Could not save result band");
      }
    }
    return assessment;
  });
  return result;
}
