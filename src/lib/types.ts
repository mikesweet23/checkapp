export type AssessmentStatus = "LIVE" | "DRAFT" | "ARCHIVED";

export type InsightLevel = "low" | "medium" | "high";

export type CategoryInsights = Record<InsightLevel, string>;

export type ScoreCategory = {
  id: string;
  name: string;
  description: string;
  color: string;
  insights?: CategoryInsights;
};

export type AnswerOption = {
  id: string;
  label: string;
  score: number;
  /** Optional sentence reflected back to the participant when they choose this answer. */
  insight?: string;
};

export type Question = {
  id: string;
  prompt: string;
  helpText?: string;
  categoryId?: string;
  type?: "SINGLE_CHOICE" | "SCALE" | "TEXT";
  optional?: boolean;
  options: AnswerOption[];
};

export type PdfContent = {
  heading?: string;
  introduction?: string;
  nextStep?: string;
  note?: string;
};

export type ResultBand = {
  id: string;
  minScore: number;
  maxScore: number;
  label: string;
  title: string;
  summary: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  videoTitle: string;
  videoDescription: string;
  videoUrl?: string;
  /** Marks results where support signposting is emphasised and Paula sees a priority flag. */
  needsSupport?: boolean;
  pdf?: PdfContent;
};

export type SignOff = {
  name: string;
  message: string;
};

export type Assessment = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  status: AssessmentStatus;
  questionCount: number;
  completionMinutes: number;
  completions: number;
  conversionRate: number;
  updatedAt: string;
  signOff?: SignOff;
  categories: ScoreCategory[];
  questions: Question[];
  resultBands: ResultBand[];
};

export type AttemptResult = {
  overall: number;
  band: ResultBand;
  categoryScores: Record<string, number>;
};

/** Choice questions store the chosen option id; written questions store the text. */
export type AnswerValues = Record<string, string>;

export type ParticipantDetails = {
  firstName: string;
  lastName: string;
  email: string;
  /** Explicit consent to process their answers (health data) and email the report. */
  consent: boolean;
  /** Optional consent for Paula to follow up and add them to the CRM. */
  followUpConsent?: boolean;
};

export type CategoryReport = ScoreCategory & {
  score: number;
  level: InsightLevel;
  insight: string;
};

export type AnswerInsight = {
  questionId: string;
  prompt: string;
  answerLabel: string;
  insight: string;
};

export type PreviousAttempt = {
  overall: number;
  completedAt: string;
  bandLabel?: string;
};

export type PersonalReport = {
  result: AttemptResult;
  categories: CategoryReport[];
  focusArea?: CategoryReport;
  strength?: CategoryReport;
  answerInsights: AnswerInsight[];
  writtenAnswers: { prompt: string; text: string }[];
  previous?: PreviousAttempt;
  needsSupport: boolean;
  completedAt: string;
};

export type AttemptDelivery = {
  attemptId: string;
  mode: "database" | "demo";
  publicToken?: string;
  emailStatus: "sent" | "failed" | "not-configured";
  pdfStatus?: "generated" | "failed";
  crmStatus?: "synced" | "failed" | "not-configured" | "skipped";
  databaseError?: boolean;
};

export type AssessmentDraft = {
  id?: string;
  name: string;
  shortName: string;
  slug: string;
  tagline: string;
  description: string;
  completionMinutes: number;
  status: AssessmentStatus;
  signOff?: SignOff;
  categories: ScoreCategory[];
  questions: Question[];
  resultBands: ResultBand[];
};
