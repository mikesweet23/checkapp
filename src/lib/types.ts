export type AssessmentStatus = "LIVE" | "DRAFT" | "ARCHIVED";

export type ScoreCategory = {
  id: string;
  name: string;
  description: string;
  color: string;
};

export type AnswerOption = {
  id: string;
  label: string;
  score: number;
};

export type Question = {
  id: string;
  prompt: string;
  helpText?: string;
  categoryId: string;
  options: AnswerOption[];
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
  categories: ScoreCategory[];
  questions: Question[];
  resultBands: ResultBand[];
};

export type AttemptResult = {
  overall: number;
  band: ResultBand;
  categoryScores: Record<string, number>;
};

export type ParticipantDetails = {
  firstName: string;
  lastName: string;
  email: string;
  consent: boolean;
};

export type AttemptDelivery = {
  attemptId: string;
  mode: "database" | "demo";
  emailStatus: "sent" | "failed" | "not-configured";
  databaseError?: boolean;
};
