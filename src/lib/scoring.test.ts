import { describe, expect, it } from "vitest";
import { assessments } from "./seed-data";
import { bandCoverageIssues, buildPersonalReport, calculateResult, chosenOption, pickBand, supportBandIds } from "./scoring";
import type { AnswerValues, Assessment } from "./types";

const anxiety = assessments[0];
const answerAll = (assessment: Assessment, pick: (options: Assessment["questions"][number]["options"]) => string): AnswerValues =>
  Object.fromEntries(assessment.questions.filter((question) => question.options.length).map((question) => [question.id, pick(question.options)]));
const highest = answerAll(anxiety, (options) => options.at(-1)!.id);
const lowest = answerAll(anxiety, (options) => options[0].id);

describe("calculateResult", () => {
  it("scores the full range from 0 to 100", () => {
    expect(calculateResult(anxiety, lowest).overall).toBe(0);
    const top = calculateResult(anxiety, highest);
    expect(top.overall).toBe(100);
    expect(top.band.id).toBe("band-support");
    expect(Object.values(top.categoryScores)).toEqual([100, 100, 100, 100]);
  });

  it("does not let written-answer questions lower the score", () => {
    const withText: Assessment = { ...anxiety, questions: [...anxiety.questions, { id: "notes", prompt: "Anything else?", type: "TEXT", categoryId: "thoughts", options: [] }] };
    const result = calculateResult(withText, { ...highest, notes: "Some thoughts" });
    expect(result.overall).toBe(100);
    expect(result.categoryScores.thoughts).toBe(100);
  });

  it("uses the chosen option even when two options share a score", () => {
    const question = { id: "q", prompt: "?", options: [{ id: "a", label: "A", score: 1 }, { id: "b", label: "B", score: 1 }] };
    expect(chosenOption(question, { q: "b" })?.label).toBe("B");
  });

  it("returns 0 rather than NaN when nothing is scorable", () => {
    const textOnly: Assessment = { ...anxiety, categories: [], questions: [{ id: "t", prompt: "?", type: "TEXT", options: [] }] };
    expect(calculateResult(textOnly, { t: "hello" }).overall).toBe(0);
  });
});

describe("result bands", () => {
  const bands = [
    { ...anxiety.resultBands[0], minScore: 0, maxScore: 24 },
    { ...anxiety.resultBands[1], minScore: 30, maxScore: 49 },
    { ...anxiety.resultBands[3], minScore: 75, maxScore: 100 },
  ];

  it("picks the nearest band for a score in a gap instead of the most severe one", () => {
    expect(pickBand(bands, 26).id).toBe(anxiety.resultBands[0].id);
    expect(pickBand(bands, 55).id).toBe(anxiety.resultBands[1].id);
    expect(pickBand(bands, 27).id).toBe(anxiety.resultBands[0].id);
  });

  it("reports gaps and overlaps", () => {
    expect(bandCoverageIssues(anxiety.resultBands)).toEqual([]);
    expect(bandCoverageIssues(bands)).toEqual(["Scores 25–29 are not covered by any band.", "Scores 50–74 are not covered by any band."]);
    expect(bandCoverageIssues([{ label: "A", minScore: 0, maxScore: 60 }, { label: "B", minScore: 50, maxScore: 100 }])).toEqual(['"A" and "B" overlap.']);
  });

  it("flags the top band for support by default", () => {
    const ids = supportBandIds([{ ...anxiety, resultBands: anxiety.resultBands.map(({ needsSupport, ...band }) => band) }]);
    expect([...ids]).toEqual(["band-support"]);
  });
});

describe("buildPersonalReport", () => {
  // High anxious thinking and body, low avoidance, medium self-trust.
  const answers: AnswerValues = { q1: "q1d", q2: "q2d", q3: "q3c", q4: "q4d", q5: "q5a", q6: "q6a", q7: "q7b", q8: "q8c" };
  const report = buildPersonalReport({ assessment: anxiety, answers, result: calculateResult(anxiety, answers), previous: { overall: 80, completedAt: "2026-06-01T10:00:00.000Z" } });

  it("finds the main focus area and strongest area", () => {
    expect(report.focusArea?.id).toBe("thoughts");
    expect(report.strength?.id).toBe("avoidance");
    expect(report.categories.find((category) => category.id === "avoidance")?.level).toBe("low");
    expect(report.focusArea?.insight).toContain("anxious predictions");
  });

  it("reflects back up to three of their strongest answers", () => {
    expect(report.answerInsights).toHaveLength(3);
    expect(report.answerInsights.every((insight) => ["q1", "q2", "q4"].includes(insight.questionId))).toBe(true);
  });

  it("carries previous attempts and written answers", () => {
    const withText: Assessment = { ...anxiety, questions: [...anxiety.questions, { id: "notes", prompt: "Anything else?", type: "TEXT", optional: true, options: [] }] };
    const withNotes = buildPersonalReport({ assessment: withText, answers: { ...answers, notes: "  Work has been hard.  " }, result: calculateResult(withText, answers) });
    expect(withNotes.writtenAnswers).toEqual([{ prompt: "Anything else?", text: "Work has been hard." }]);
    expect(report.previous?.overall).toBe(80);
  });

  it("does not invent a focus area when every area scores the same", () => {
    const flat = buildPersonalReport({ assessment: anxiety, answers: lowest, result: calculateResult(anxiety, lowest) });
    expect(flat.focusArea).toBeUndefined();
    expect(flat.strength).toBeUndefined();
    expect(flat.needsSupport).toBe(false);
  });
});
