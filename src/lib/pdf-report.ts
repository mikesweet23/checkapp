import fs from "node:fs";
import path from "node:path";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import type { Assessment, AttemptResult, ParticipantDetails } from "./types";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 52;

const colours = {
  ink: rgb(0.27, 0.27, 0.27),
  muted: rgb(0.40, 0.40, 0.40),
  orange: rgb(0.945, 0.388, 0.204),
  peach: rgb(0.992, 0.906, 0.875),
  plum: rgb(0.27, 0.27, 0.27),
  sage: rgb(0.929, 0.949, 0.933),
  paper: rgb(1, 1, 1),
  white: rgb(1, 1, 1),
  line: rgb(0.92, 0.86, 0.83),
};

function asciiText(value: string) {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E]/g, "");
}

function hexColour(hex: string) {
  const value = hex.replace("#", "");
  return rgb(parseInt(value.slice(0, 2), 16) / 255, parseInt(value.slice(2, 4), 16) / 255, parseInt(value.slice(4, 6), 16) / 255);
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = asciiText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) line = candidate;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrapped(page: PDFPage, text: string, x: number, y: number, width: number, font: PDFFont, size: number, colour = colours.ink, lineHeight = size * 1.45) {
  const lines = wrapText(text, font, size, width);
  lines.forEach((line, index) => page.drawText(line, { x, y: y - (index * lineHeight), size, font, color: colour }));
  return y - (lines.length * lineHeight);
}

function drawFooter(page: PDFPage, pageNumber: number, regular: PDFFont) {
  page.drawLine({ start: { x: MARGIN, y: 42 }, end: { x: PAGE_WIDTH - MARGIN, y: 42 }, thickness: 0.7, color: colours.line });
  page.drawText("Absolute Mind  |  Personalised check-in report", { x: MARGIN, y: 25, size: 8, font: regular, color: colours.muted });
  page.drawText(`${pageNumber} / 2`, { x: PAGE_WIDTH - MARGIN - 24, y: 25, size: 8, font: regular, color: colours.muted });
}

function drawCategoryBar(page: PDFPage, label: string, score: number, colour: string, x: number, y: number, width: number, regular: PDFFont, bold: PDFFont) {
  page.drawText(asciiText(label), { x, y, size: 10, font: regular, color: colours.ink });
  page.drawText(`${score}%`, { x: x + width - 28, y, size: 10, font: bold, color: colours.orange });
  page.drawRectangle({ x, y: y - 16, width, height: 7, color: colours.line });
  page.drawRectangle({ x, y: y - 16, width: Math.max(4, (width * score) / 100), height: 7, color: hexColour(colour) });
}

export async function createPdfReport({ participant, assessment, result }: { participant: ParticipantDetails; assessment: Assessment; result: AttemptResult }) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(fs.readFileSync(path.join(process.cwd(), "public", "absolute-mind-logo.png")));
  const logoScale = 0.42;
  const logoWidth = logo.width * logoScale;
  const logoHeight = logo.height * logoScale;
  const pageOne = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pageOne.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: colours.paper });
  pageOne.drawRectangle({ x: 0, y: PAGE_HEIGHT - 12, width: PAGE_WIDTH, height: 12, color: colours.orange });
  pageOne.drawImage(logo, { x: MARGIN, y: PAGE_HEIGHT - 72, width: logoWidth, height: logoHeight });
  pageOne.drawText("PERSONALISED REPORT", { x: MARGIN, y: PAGE_HEIGHT - 116, size: 10, font: bold, color: colours.orange });

  const title = `${participant.firstName}'s ${assessment.shortName}`;
  let y = PAGE_HEIGHT - 154;
  y = drawWrapped(pageOne, title, MARGIN, y, PAGE_WIDTH - (MARGIN * 2), bold, 29, colours.ink, 34);
  y -= 12;
  y = drawWrapped(pageOne, "A thoughtful snapshot of the patterns behind your answers, with a clear next step to consider.", MARGIN, y, 360, regular, 13, colours.muted, 19);

  const scoreX = PAGE_WIDTH - MARGIN - 132;
  const scoreY = PAGE_HEIGHT - 242;
  pageOne.drawCircle({ x: scoreX + 66, y: scoreY, size: 66, color: colours.peach });
  pageOne.drawCircle({ x: scoreX + 66, y: scoreY, size: 54, color: colours.paper, borderColor: colours.orange, borderWidth: 5 });
  pageOne.drawText(`${result.overall}`, { x: scoreX + 42, y: scoreY + 4, size: 27, font: bold, color: colours.orange });
  pageOne.drawText("out of 100", { x: scoreX + 43, y: scoreY - 16, size: 8, font: regular, color: colours.muted });

  const cardTop = Math.min(y - 20, PAGE_HEIGHT - 310);
  pageOne.drawRectangle({ x: MARGIN, y: cardTop - 135, width: PAGE_WIDTH - (MARGIN * 2), height: 135, color: colours.white, borderColor: colours.line, borderWidth: 1 });
  pageOne.drawText("YOUR RESULT", { x: MARGIN + 20, y: cardTop - 27, size: 9, font: bold, color: colours.orange });
  pageOne.drawText(asciiText(result.band.label), { x: MARGIN + 20, y: cardTop - 51, size: 17, font: bold, color: colours.plum });
  drawWrapped(pageOne, result.band.summary, MARGIN + 20, cardTop - 76, PAGE_WIDTH - (MARGIN * 2) - 40, regular, 11, colours.muted, 16);

  pageOne.drawText("YOUR AREAS AT A GLANCE", { x: MARGIN, y: cardTop - 185, size: 10, font: bold, color: colours.orange });
  assessment.categories.forEach((category, index) => drawCategoryBar(pageOne, category.name, result.categoryScores[category.id] ?? 0, category.color, MARGIN, cardTop - 215 - (index * 48), PAGE_WIDTH - (MARGIN * 2), regular, bold));
  drawFooter(pageOne, 1, regular);

  const pageTwo = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pageTwo.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: colours.paper });
  pageTwo.drawRectangle({ x: 0, y: PAGE_HEIGHT - 12, width: PAGE_WIDTH, height: 12, color: colours.orange });
  pageTwo.drawImage(logo, { x: MARGIN, y: PAGE_HEIGHT - 72, width: logoWidth, height: logoHeight });
  pageTwo.drawText("A CALMER WAY FORWARD", { x: MARGIN, y: PAGE_HEIGHT - 125, size: 10, font: bold, color: colours.orange });
  let secondY = PAGE_HEIGHT - 166;
  secondY = drawWrapped(pageTwo, asciiText(result.band.videoTitle), MARGIN, secondY, PAGE_WIDTH - (MARGIN * 2), bold, 26, colours.ink, 31);
  secondY -= 10;
  secondY = drawWrapped(pageTwo, result.band.body, MARGIN, secondY, PAGE_WIDTH - (MARGIN * 2), regular, 13, colours.muted, 20);

  const calloutY = secondY - 26;
  pageTwo.drawRectangle({ x: MARGIN, y: calloutY - 104, width: PAGE_WIDTH - (MARGIN * 2), height: 104, color: colours.plum });
  pageTwo.drawText("YOUR NEXT STEP", { x: MARGIN + 22, y: calloutY - 28, size: 9, font: bold, color: colours.peach });
  drawWrapped(pageTwo, result.band.videoDescription, MARGIN + 22, calloutY - 51, PAGE_WIDTH - (MARGIN * 2) - 44, regular, 11, colours.white, 16);

  const detailY = calloutY - 154;
  pageTwo.drawText("ABOUT THIS CHECK-IN", { x: MARGIN, y: detailY, size: 10, font: bold, color: colours.orange });
  const detailText = `Completed for ${participant.firstName} ${participant.lastName} (${participant.email}). Your score is a reflective snapshot, not a diagnosis. It is intended to help you notice patterns and decide whether a conversation or further support would be useful.`;
  drawWrapped(pageTwo, detailText, MARGIN, detailY - 28, PAGE_WIDTH - (MARGIN * 2), regular, 11, colours.muted, 17);
  pageTwo.drawRectangle({ x: MARGIN, y: 104, width: PAGE_WIDTH - (MARGIN * 2), height: 76, color: colours.peach });
  pageTwo.drawText("A note from Absolute Mind", { x: MARGIN + 18, y: 157, size: 11, font: bold, color: colours.plum });
  drawWrapped(pageTwo, "You do not need to wait until things feel unbearable before asking for support. A calm, structured conversation can be a useful place to begin.", MARGIN + 18, 137, PAGE_WIDTH - (MARGIN * 2) - 36, regular, 10, colours.plum, 14);
  drawFooter(pageTwo, 2, regular);

  return pdf.save();
}
