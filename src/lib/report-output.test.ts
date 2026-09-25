import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { createPdfReport, reportFilename } from "./pdf-report";
import { rateLimit } from "./rate-limit";
import { assessments } from "./seed-data";
import { buildPersonalReport, calculateResult } from "./scoring";
import { resultEmailContent } from "./services";
import { splitEmphasis, videoEmbedUrl } from "./text";
import type { AnswerValues, Assessment, ParticipantDetails } from "./types";

const anxiety: Assessment = { ...assessments[0], questions: [...assessments[0].questions, { id: "notes", prompt: "Is there anything else you would like Paula to know?", type: "TEXT", optional: true, options: [] }] };
const answers: AnswerValues = { q1: "q1d", q2: "q2c", q3: "q3d", q4: "q4c", q5: "q5c", q6: "q6b", q7: "q7c", q8: "q8d", notes: "Mornings are the hardest — especially before work." };
const participant: ParticipantDetails = { firstName: "Zoë", lastName: "Ní Bhriain", email: "zoe@example.com", consent: true, followUpConsent: true };
const report = buildPersonalReport({ assessment: anxiety, answers, result: calculateResult(anxiety, answers), previous: { overall: 82, completedAt: "2026-06-12T09:00:00.000Z" }, completedAt: "2026-09-25T09:00:00.000Z" });

describe("PDF report", () => {
  it("renders accented names and flows onto extra pages", async () => {
    const bytes = await createPdfReport({ participant, assessment: anxiety, report, resultsUrl: "https://check.example.com/results/abc" });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(2);
    expect(pdf.getTitle()).toBe("Zoë's Anxiety Check report");
    if (process.env.WRITE_SAMPLE_PDF) fs.writeFileSync(path.join(process.cwd(), "output", "pdf", "absolute-mind-anxiety-report-sample.pdf"), bytes);
  });

  it("builds a safe, readable filename", () => {
    expect(reportFilename(anxiety, participant)).toBe("zoe-anxiety-check-report.pdf");
  });
});

describe("result email", () => {
  it("is personal and escapes participant input", () => {
    const { html, text } = resultEmailContent({ participant: { ...participant, firstName: "<b>Zoë</b>" }, assessment: anxiety, report, resultsUrl: "https://check.example.com/results/abc" });
    expect(html).toContain("&lt;b&gt;Zoë&lt;/b&gt;");
    expect(html).not.toContain("<b>Zoë</b>");
    expect(html).toContain("Your main focus");
    expect(html).toContain("116 123");
    expect(text).toContain("from 82 to");
    expect(text).toContain("https://check.example.com/results/abc");
  });
});

describe("helpers", () => {
  it("limits repeated requests", () => {
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    expect(rateLimit(key, 2, 60_000).ok).toBe(false);
  });

  it("splits headings for emphasis and embeds videos", () => {
    expect(splitEmphasis("Understand Your Anxious Mind")).toEqual(["Understand Your", "Anxious Mind"]);
    expect(splitEmphasis("Hello")).toEqual(["", "Hello"]);
    expect(videoEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe("https://www.youtube-nocookie.com/embed/abc123");
    expect(videoEmbedUrl("https://vimeo.com/12345")).toBe("https://player.vimeo.com/video/12345");
    expect(videoEmbedUrl("https://example.com/video")).toBeNull();
  });
});
