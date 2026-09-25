import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont, PDFImage, PDFPage, RGB, rgb } from "pdf-lib";
import type { Assessment, ParticipantDetails, PersonalReport } from "./types";
import { formatReportDate, progressSentence } from "./scoring";
import { reflectionDisclaimer, supportHeading, supportLines } from "./support";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 52;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const TOP = PAGE_HEIGHT - 110;
const BOTTOM = 70;

const colours = {
  ink: rgb(0.267, 0.267, 0.267),
  muted: rgb(0.4, 0.4, 0.4),
  orange: rgb(0.945, 0.388, 0.204),
  orangeDark: rgb(0.851, 0.31, 0.145),
  peach: rgb(0.992, 0.906, 0.875),
  paper: rgb(1, 1, 1),
  cream: rgb(0.969, 0.969, 0.969),
  line: rgb(0.898, 0.898, 0.898),
};

type Fonts = { regular: PDFFont; semibold: PDFFont; bold: PDFFont };

function assetPath(...segments: string[]) {
  return path.join(process.cwd(), ...segments);
}

/** Keeps every printable character (accents included); only control characters are dropped. */
function clean(value: string) {
  return value.replace(/ /g, " ").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").replace(/[​-‍️]/g, "");
}

function hexColour(hex: string, fallback: RGB) {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return fallback;
  return rgb(parseInt(value.slice(0, 2), 16) / 255, parseInt(value.slice(2, 4), 16) / 255, parseInt(value.slice(4, 6), 16) / 255);
}

export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of clean(text).split(/\n+/)) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) line = candidate;
      else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
  }
  return lines;
}

/** A simple top-to-bottom layout cursor that starts a new branded page when space runs out. */
class Flow {
  page!: PDFPage;
  y = TOP;
  constructor(private pdf: PDFDocument, private fonts: Fonts, private logo: PDFImage) { this.addPage(); }

  addPage() {
    this.page = this.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 10, width: PAGE_WIDTH, height: 10, color: colours.orange });
    const logoWidth = 150;
    const logoHeight = (this.logo.height / this.logo.width) * logoWidth;
    this.page.drawImage(this.logo, { x: MARGIN, y: PAGE_HEIGHT - 40 - logoHeight, width: logoWidth, height: logoHeight });
    this.y = TOP;
  }

  ensure(height: number) {
    if (this.y - height < BOTTOM) this.addPage();
  }

  gap(size: number) { this.y -= size; }

  text(value: string, options: { font?: PDFFont; size?: number; colour?: RGB; lineHeight?: number; x?: number; width?: number } = {}) {
    const { font = this.fonts.regular, size = 11, colour = colours.muted, x = MARGIN, width = CONTENT_WIDTH } = options;
    const lineHeight = options.lineHeight ?? size * 1.5;
    for (const line of wrapText(value, font, size, width)) {
      this.ensure(lineHeight);
      this.page.drawText(line, { x, y: this.y - size, size, font, color: colour });
      this.y -= lineHeight;
    }
  }

  eyebrow(value: string, colour = colours.orangeDark) {
    this.ensure(40);
    this.page.drawText(value.toUpperCase(), { x: MARGIN, y: this.y - 9, size: 9, font: this.fonts.bold, color: colour });
    this.y -= 20;
  }

  heading(value: string, size = 17) {
    this.text(value, { font: this.fonts.bold, size, colour: colours.ink, lineHeight: size * 1.25 });
    this.gap(4);
  }

  /** Draws a filled box sized to its text; the text block is measured before drawing. */
  box({ title, body, fill, titleColour, bodyColour, border }: { title: string; body: string[]; fill: RGB; titleColour: RGB; bodyColour: RGB; border?: RGB }) {
    const padding = 18;
    const width = CONTENT_WIDTH - padding * 2;
    const bodyLines = body.map((paragraph) => wrapText(paragraph, this.fonts.regular, 10.5, width));
    const height = padding * 2 + 18 + bodyLines.reduce((sum, lines) => sum + lines.length * 15.5 + 5, 0);
    this.ensure(height);
    this.page.drawRectangle({ x: MARGIN, y: this.y - height, width: CONTENT_WIDTH, height, color: fill, borderColor: border, borderWidth: border ? 1 : 0 });
    let y = this.y - padding - 10;
    this.page.drawText(clean(title), { x: MARGIN + padding, y, size: 10.5, font: this.fonts.bold, color: titleColour });
    y -= 20;
    for (const lines of bodyLines) {
      for (const line of lines) { this.page.drawText(line, { x: MARGIN + padding, y: y - 3, size: 10.5, font: this.fonts.regular, color: bodyColour }); y -= 15.5; }
      y -= 5;
    }
    this.y -= height + 16;
  }

  bar(label: string, score: number, colour: RGB, note?: string) {
    this.ensure(note ? 44 : 32);
    const { regular, bold } = this.fonts;
    this.page.drawText(clean(label), { x: MARGIN, y: this.y - 10, size: 10.5, font: bold, color: colours.ink });
    const scoreText = `${score}%`;
    this.page.drawText(scoreText, { x: MARGIN + CONTENT_WIDTH - bold.widthOfTextAtSize(scoreText, 10.5), y: this.y - 10, size: 10.5, font: bold, color: colours.ink });
    if (note) this.page.drawText(clean(note), { x: MARGIN + CONTENT_WIDTH - bold.widthOfTextAtSize(scoreText, 10.5) - regular.widthOfTextAtSize(note, 8.5) - 10, y: this.y - 10, size: 8.5, font: regular, color: colours.orangeDark });
    this.page.drawRectangle({ x: MARGIN, y: this.y - 24, width: CONTENT_WIDTH, height: 6, color: colours.line });
    this.page.drawRectangle({ x: MARGIN, y: this.y - 24, width: Math.max(4, (CONTENT_WIDTH * Math.min(score, 100)) / 100), height: 6, color: colour });
    this.y -= 38;
  }
}

async function loadFonts(pdf: PDFDocument): Promise<Fonts> {
  pdf.registerFontkit(fontkit);
  const read = (file: string) => fs.readFileSync(assetPath("assets", "fonts", file));
  const [regular, semibold, bold] = await Promise.all([
    pdf.embedFont(read("Montserrat-Regular.ttf"), { subset: true }),
    pdf.embedFont(read("Montserrat-SemiBold.ttf"), { subset: true }),
    pdf.embedFont(read("Montserrat-Bold.ttf"), { subset: true }),
  ]);
  return { regular, semibold, bold };
}

export async function createPdfReport({ participant, assessment, report, resultsUrl }: { participant: ParticipantDetails; assessment: Assessment; report: PersonalReport; resultsUrl?: string }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${participant.firstName}'s ${assessment.shortName} report`);
  pdf.setAuthor("Absolute Mind");
  const fonts = await loadFonts(pdf);
  const logo = await pdf.embedPng(fs.readFileSync(assetPath("public", "absolute-mind-logo.png")));
  const flow = new Flow(pdf, fonts, logo);
  const { result } = report;
  const band = result.band;

  // Opening: title, intro and overall score.
  flow.eyebrow(band.pdf?.heading || "Personalised report");
  const titleWidth = CONTENT_WIDTH - 150;
  const titleTop = flow.y;
  flow.text(`${participant.firstName}'s ${assessment.shortName}`, { font: fonts.bold, size: 28, colour: colours.ink, lineHeight: 33, width: titleWidth });
  flow.gap(6);
  flow.text(`Completed ${formatReportDate(report.completedAt)}`, { size: 9.5, width: titleWidth });
  flow.gap(8);
  flow.text(band.pdf?.introduction || "A thoughtful snapshot of the patterns behind your answers, with a clear next step to consider.", { size: 12, lineHeight: 18, width: titleWidth });
  const circleX = PAGE_WIDTH - MARGIN - 62;
  const circleY = titleTop - 62;
  flow.page.drawCircle({ x: circleX, y: circleY, size: 60, color: colours.peach });
  flow.page.drawCircle({ x: circleX, y: circleY, size: 49, color: colours.paper, borderColor: colours.orange, borderWidth: 5 });
  const scoreText = `${result.overall}`;
  flow.page.drawText(scoreText, { x: circleX - fonts.bold.widthOfTextAtSize(scoreText, 28) / 2, y: circleY - 2, size: 28, font: fonts.bold, color: colours.orangeDark });
  flow.page.drawText("out of 100", { x: circleX - fonts.regular.widthOfTextAtSize("out of 100", 8) / 2, y: circleY - 16, size: 8, font: fonts.regular, color: colours.muted });
  flow.y = Math.min(flow.y, circleY - 76);

  flow.box({ title: `YOUR RESULT: ${band.label}`, body: [band.title, band.summary].filter(Boolean), fill: colours.cream, titleColour: colours.orangeDark, bodyColour: colours.ink });

  const progress = progressSentence(report);
  if (progress) flow.box({ title: "SINCE LAST TIME", body: [progress], fill: colours.paper, titleColour: colours.orangeDark, bodyColour: colours.ink, border: colours.line });

  // Areas at a glance, with the focus area and strength called out.
  if (report.categories.length) {
    flow.eyebrow("Your areas at a glance");
    for (const category of report.categories) {
      const note = category.id === report.focusArea?.id ? "Main focus area" : category.id === report.strength?.id ? "Strongest area" : undefined;
      flow.bar(category.name, category.score, hexColour(category.color, colours.orange), note);
    }
    flow.gap(6);
  }

  const withInsight = report.categories.filter((category) => category.insight);
  if (withInsight.length) {
    flow.eyebrow("What your answers are telling us");
    for (const category of withInsight) {
      flow.heading(category.name, 12.5);
      flow.text(category.insight, { lineHeight: 16.5 });
      flow.gap(10);
    }
  }

  if (report.answerInsights.length) {
    flow.eyebrow("Things you told us");
    for (const insight of report.answerInsights) {
      flow.text(`"${insight.prompt}" — ${insight.answerLabel}`, { font: fonts.semibold, colour: colours.ink, size: 10.5 });
      flow.text(insight.insight, { lineHeight: 16.5 });
      flow.gap(10);
    }
  }

  if (report.writtenAnswers.length) {
    flow.eyebrow("In your words");
    for (const answer of report.writtenAnswers) {
      flow.text(answer.prompt, { font: fonts.semibold, colour: colours.ink, size: 10.5 });
      flow.text(answer.text, { lineHeight: 16.5 });
      flow.gap(10);
    }
  }

  // The way forward for this band.
  flow.gap(6);
  flow.eyebrow("What this means for you");
  flow.heading(band.videoTitle || band.title, 18);
  flow.text(band.body, { size: 11.5, lineHeight: 17.5 });
  if (band.videoUrl) { flow.gap(4); flow.text(`Watch: ${band.videoUrl}`, { size: 10, colour: colours.orangeDark }); }
  flow.gap(14);

  flow.box({ title: "YOUR NEXT STEP", body: [band.pdf?.nextStep || band.videoDescription || band.summary, `${band.ctaLabel}: ${band.ctaHref}`].filter(Boolean), fill: colours.ink, titleColour: colours.peach, bodyColour: colours.paper });

  const signOff = assessment.signOff;
  const closing = [band.pdf?.note, signOff?.message].filter((value): value is string => Boolean(value?.trim()));
  if (closing.length || signOff?.name) flow.box({ title: signOff?.name ? `A note from ${signOff.name}` : "A note from Absolute Mind", body: closing.length ? closing : ["Thank you for taking the time to reflect."], fill: colours.peach, titleColour: colours.ink, bodyColour: colours.ink });

  flow.box({ title: supportHeading, body: supportLines, fill: colours.paper, titleColour: report.needsSupport ? colours.orangeDark : colours.ink, bodyColour: colours.ink, border: report.needsSupport ? colours.orange : colours.line });

  flow.eyebrow("About this check-in");
  flow.text(`Prepared for ${participant.firstName} ${participant.lastName}. ${reflectionDisclaimer} Your score is a reflective snapshot to help you notice patterns and decide whether a conversation or further support would be useful.`, { size: 9.5, lineHeight: 14 });
  if (resultsUrl) { flow.gap(4); flow.text(`View your results online: ${resultsUrl}`, { size: 9.5, lineHeight: 14, colour: colours.orangeDark }); }

  const pages = pdf.getPages();
  pages.forEach((page, index) => {
    page.drawLine({ start: { x: MARGIN, y: 42 }, end: { x: PAGE_WIDTH - MARGIN, y: 42 }, thickness: 0.7, color: colours.line });
    page.drawText("Absolute Mind  |  Personalised check-in report", { x: MARGIN, y: 26, size: 8, font: fonts.regular, color: colours.muted });
    const label = `${index + 1} / ${pages.length}`;
    page.drawText(label, { x: PAGE_WIDTH - MARGIN - fonts.regular.widthOfTextAtSize(label, 8), y: 26, size: 8, font: fonts.regular, color: colours.muted });
  });

  return pdf.save();
}

export function reportFilename(assessment: Assessment, participant: ParticipantDetails) {
  const name = `${participant.firstName}-${assessment.shortName}`.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${name || assessment.slug}-report.pdf`;
}
