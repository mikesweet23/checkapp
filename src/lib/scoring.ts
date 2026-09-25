import type { AnswerInsight, AnswerValues, Assessment, AttemptResult, CategoryReport, InsightLevel, PersonalReport, PreviousAttempt, Question, ResultBand } from "./types";

export function isScorable(question: Question) {
  return question.type !== "TEXT" && question.options.length > 0;
}

function questionMax(question: Question) {
  return Math.max(0, ...question.options.map((option) => option.score));
}

export function chosenOption(question: Question, answers: AnswerValues) {
  const value = answers[question.id];
  return question.options.find((option) => option.id === value);
}

function percentage(questions: Question[], answers: AnswerValues) {
  const max = questions.reduce((sum, question) => sum + questionMax(question), 0);
  const total = questions.reduce((sum, question) => sum + (chosenOption(question, answers)?.score ?? 0), 0);
  return max > 0 ? Math.round((total / max) * 100) : 0;
}

/**
 * Picks the band containing the score. If the bands leave a gap, the nearest band
 * wins (the lower one on a tie) so a gap never pushes someone into the most
 * severe result.
 */
export function pickBand(bands: ResultBand[], score: number): ResultBand {
  const exact = bands.find((band) => score >= band.minScore && score <= band.maxScore);
  if (exact) return exact;
  const distance = (band: ResultBand) => score < band.minScore ? band.minScore - score : score - band.maxScore;
  return [...bands].sort((a, b) => distance(a) - distance(b) || a.minScore - b.minScore)[0];
}

/** Describes gaps and overlaps in 0-100 band coverage, for the admin builder. */
export function bandCoverageIssues(bands: Pick<ResultBand, "minScore" | "maxScore" | "label">[]) {
  const issues: string[] = [];
  if (!bands.length) return ["Add at least one result band."];
  const sorted = [...bands].sort((a, b) => a.minScore - b.minScore);
  for (const band of sorted) {
    if (band.minScore > band.maxScore) issues.push(`"${band.label}" has a minimum above its maximum.`);
  }
  if (sorted[0].minScore > 0) issues.push(`Scores 0–${sorted[0].minScore - 1} are not covered by any band.`);
  for (let index = 1; index < sorted.length; index++) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (current.minScore > previous.maxScore + 1) issues.push(`Scores ${previous.maxScore + 1}–${current.minScore - 1} are not covered by any band.`);
    if (current.minScore <= previous.maxScore) issues.push(`"${previous.label}" and "${current.label}" overlap.`);
  }
  const top = Math.max(...sorted.map((band) => band.maxScore));
  if (top < 100) issues.push(`Scores ${top + 1}–100 are not covered by any band.`);
  return issues;
}

export function calculateResult(assessment: Assessment, answers: AnswerValues): AttemptResult {
  const scorable = assessment.questions.filter(isScorable);
  const overall = percentage(scorable, answers);
  const categoryScores = Object.fromEntries(assessment.categories.map((category) => [
    category.id,
    percentage(scorable.filter((question) => question.categoryId === category.id), answers),
  ]));
  return { overall, band: pickBand(assessment.resultBands, overall), categoryScores };
}

export function levelFor(score: number): InsightLevel {
  if (score >= 67) return "high";
  if (score >= 34) return "medium";
  return "low";
}

/** Everything that makes a report specific to one person, shared by the results page, PDF and email. */
export function buildPersonalReport({ assessment, answers, result, previous, completedAt }: {
  assessment: Assessment;
  answers: AnswerValues;
  result: AttemptResult;
  previous?: PreviousAttempt;
  completedAt?: string | Date;
}): PersonalReport {
  const categories: CategoryReport[] = assessment.categories
    .filter((category) => assessment.questions.some((question) => question.categoryId === category.id && isScorable(question)))
    .map((category) => {
      const score = result.categoryScores[category.id] ?? 0;
      const level = levelFor(score);
      return { ...category, score, level, insight: category.insights?.[level]?.trim() ?? "" };
    });

  const ranked = [...categories].sort((a, b) => b.score - a.score);
  const hasSpread = ranked.length > 1 && ranked[0].score !== ranked.at(-1)!.score;
  const focusArea = hasSpread && ranked[0].score > 0 ? ranked[0] : undefined;
  const strength = hasSpread ? ranked.at(-1) : undefined;

  const answerInsights: AnswerInsight[] = assessment.questions
    .filter(isScorable)
    .map((question) => ({ question, option: chosenOption(question, answers) }))
    .filter(({ option }) => option?.insight?.trim())
    .sort((a, b) => (b.option!.score - a.option!.score))
    .slice(0, 3)
    .map(({ question, option }) => ({ questionId: question.id, prompt: question.prompt, answerLabel: option!.label, insight: option!.insight!.trim() }));

  const writtenAnswers = assessment.questions
    .filter((question) => question.type === "TEXT")
    .map((question) => ({ prompt: question.prompt, text: (answers[question.id] ?? "").trim() }))
    .filter((answer) => answer.text);

  const topBandId = [...assessment.resultBands].sort((a, b) => b.maxScore - a.maxScore)[0]?.id;
  const needsSupport = result.band.needsSupport ?? result.band.id === topBandId;
  const date = completedAt ? new Date(completedAt) : new Date();

  return { result, categories, focusArea, strength, answerInsights, writtenAnswers, previous, needsSupport, completedAt: date.toISOString() };
}

export function formatReportDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function progressSentence(report: PersonalReport) {
  if (!report.previous) return "";
  const change = report.result.overall - report.previous.overall;
  const since = `your last check-in on ${formatReportDate(report.previous.completedAt)}`;
  if (change === 0) return `Your score is the same as ${since} (${report.previous.overall}).`;
  return `Since ${since}, your score has moved from ${report.previous.overall} to ${report.result.overall}${change < 0 ? " — a lower score means these patterns are having less impact." : "."}`;
}

/** Ids of result bands marked for support (or each assessment's top band when not set). */
export function supportBandIds(assessments: Assessment[]) {
  const ids = new Set<string>();
  for (const assessment of assessments) {
    const topBandId = [...assessment.resultBands].sort((a, b) => b.maxScore - a.maxScore)[0]?.id;
    for (const band of assessment.resultBands) if (band.needsSupport ?? band.id === topBandId) ids.add(band.id);
  }
  return ids;
}
