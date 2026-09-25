import type { Assessment, AttemptResult, ParticipantDetails, PersonalReport } from "./types";
import { createPdfReport, reportFilename } from "./pdf-report";
import { configuredAdminEmails } from "./admin-auth";
import { progressSentence } from "./scoring";
import { reflectionDisclaimer, supportHeading, supportLines } from "./support";

/**
 * Integration seams. Keep platform behaviour independent from any vendor so
 * Postgres, email and CRM providers can be swapped safely.
 */
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] ?? character);
}

async function sendEmail(payload: { to: string[]; subject: string; html: string; text: string; attachments?: { filename: string; content: string }[] }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REPORT_FROM_EMAIL;
  if (!apiKey || !from) return { status: "not-configured" as const };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, ...payload }),
  });
  if (!response.ok) {
    console.error("Email provider returned an error", response.status);
    return { status: "failed" as const };
  }
  const providerResponse = await response.json().catch(() => null) as { id?: string } | null;
  return { status: "sent" as const, providerId: providerResponse?.id };
}

const paragraph = (value: string, style = "font-size:16px;line-height:1.6;margin:0 0 14px") => `<p style="${style}">${escapeHtml(value)}</p>`;
const eyebrow = (value: string) => `<p style="color:#d94f25;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px;margin:28px 0 10px">${escapeHtml(value)}</p>`;

export function resultEmailContent({ participant, assessment, report, resultsUrl }: { participant: ParticipantDetails; assessment: Assessment; report: PersonalReport; resultsUrl?: string }) {
  const { result } = report;
  const band = result.band;
  const progress = progressSentence(report);
  const categoryRows = report.categories.map((category) => {
    const tag = category.id === report.focusArea?.id ? " · main focus" : category.id === report.strength?.id ? " · strongest area" : "";
    return `<tr><td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;color:#444"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${escapeHtml(category.color)};margin-right:8px"></span>${escapeHtml(category.name)}<span style="color:#d94f25;font-size:12px">${tag}</span></td><td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:700;color:#444">${category.score}%</td></tr>`;
  }).join("");
  const focus = report.focusArea?.insight ? `${eyebrow(`Your main focus: ${report.focusArea.name}`)}${paragraph(report.focusArea.insight)}` : "";
  const strength = report.strength?.insight ? `${eyebrow(`Your strongest area: ${report.strength.name}`)}${paragraph(report.strength.insight)}` : "";
  const toldUs = report.answerInsights.length ? `${eyebrow("Things you told us")}${report.answerInsights.map((insight) => paragraph(insight.insight)).join("")}` : "";
  const support = `<div style="border:1px solid ${report.needsSupport ? "#f16334" : "#e5e5e5"};border-radius:14px;padding:16px 18px;margin-top:28px"><p style="font-weight:700;margin:0 0 8px;color:${report.needsSupport ? "#d94f25" : "#444"}">${escapeHtml(supportHeading)}</p>${supportLines.map((line) => paragraph(line, "font-size:14px;line-height:1.5;margin:0 0 6px")).join("")}</div>`;
  const signOff = assessment.signOff?.message ? `<div style="background:#fde7df;border-radius:14px;padding:16px 18px;margin-top:28px">${paragraph(assessment.signOff.message, "font-size:15px;line-height:1.6;margin:0 0 8px")}<p style="font-weight:700;margin:0">${escapeHtml(assessment.signOff.name)}</p></div>` : "";
  const button = (href: string, label: string, primary = true) => `<a href="${escapeHtml(href)}" style="display:inline-block;background:${primary ? "#f16334" : "#444"};color:white;text-decoration:none;padding:13px 18px;border-radius:999px;font-weight:700;margin:0 8px 8px 0">${escapeHtml(label)}</a>`;

  const html = `<div style="background:#f7f7f7;padding:32px 16px;font-family:Montserrat,Arial,sans-serif;color:#444"><div style="max-width:620px;margin:0 auto;background:white;border:1px solid #e5e5e5;border-radius:18px;padding:32px"><p style="color:#d94f25;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px;margin:0">Absolute Mind · Personalised report</p><h1 style="font-size:28px;line-height:1.15;margin:16px 0 10px">${escapeHtml(participant.firstName)}, here is your ${escapeHtml(assessment.shortName)} result</h1><p style="font-size:18px;margin:0 0 20px"><strong style="color:#d94f25">${result.overall}/100</strong> · ${escapeHtml(band.label)}</p>${paragraph(band.summary)}${progress ? paragraph(progress, "font-size:15px;line-height:1.6;margin:0 0 14px;padding:12px 14px;background:#f7f7f7;border-radius:10px") : ""}${categoryRows ? `${eyebrow("Your areas at a glance")}<table style="width:100%;border-collapse:collapse;font-size:15px">${categoryRows}</table>` : ""}${focus}${strength}${toldUs}${eyebrow(band.videoTitle || band.title)}${paragraph(band.body)}<p style="margin-top:24px">${resultsUrl ? button(resultsUrl, "View your full results") : ""}${button(band.ctaHref, band.ctaLabel, !resultsUrl)}</p>${signOff}${support}<p style="font-size:12px;line-height:1.5;color:#666;margin-top:24px">${escapeHtml(reflectionDisclaimer)} Your full report is attached as a PDF.</p></div></div>`;

  const text = [
    `${participant.firstName}, your ${assessment.shortName} result is ${result.overall}/100 — ${band.label}.`,
    band.summary,
    progress,
    report.categories.length ? `Your areas:\n${report.categories.map((category) => `${category.name}: ${category.score}%`).join("\n")}` : "",
    report.focusArea?.insight ? `Your main focus — ${report.focusArea.name}: ${report.focusArea.insight}` : "",
    band.body,
    resultsUrl ? `View your full results: ${resultsUrl}` : "",
    `${band.ctaLabel}: ${band.ctaHref}`,
    assessment.signOff?.message ? `${assessment.signOff.message}\n— ${assessment.signOff.name}` : "",
    `${supportHeading}:\n${supportLines.join("\n")}`,
    reflectionDisclaimer,
  ].filter(Boolean).join("\n\n");

  return { html, text, subject: `Your ${assessment.shortName} report from Absolute Mind` };
}

export async function sendResultEmail({ participant, assessment, report, resultsUrl }: {
  participant: ParticipantDetails;
  assessment: Assessment;
  report: PersonalReport;
  resultsUrl?: string;
}) {
  if (!process.env.RESEND_API_KEY || !process.env.REPORT_FROM_EMAIL) return { status: "not-configured" as const };
  let pdf: Awaited<ReturnType<typeof generatePdfReport>>;
  try {
    pdf = await generatePdfReport({ participant, assessment, report, resultsUrl });
  } catch (error) {
    console.error("Could not generate PDF report", error);
    return { status: "failed" as const, pdfStatus: "failed" as const };
  }
  try {
    const { html, text, subject } = resultEmailContent({ participant, assessment, report, resultsUrl });
    const sent = await sendEmail({ to: [participant.email], subject, html, text, attachments: [{ filename: pdf.filename, content: pdf.content }] });
    return { ...sent, pdfStatus: "generated" as const };
  } catch (error) {
    console.error("Could not send result email", error);
    return { status: "failed" as const, pdfStatus: "generated" as const };
  }
}

export async function generatePdfReport({ participant, assessment, report, resultsUrl }: { participant: ParticipantDetails; assessment: Assessment; report: PersonalReport; resultsUrl?: string }) {
  const bytes = await createPdfReport({ participant, assessment, report, resultsUrl });
  return {
    status: "generated" as const,
    filename: reportFilename(assessment, participant),
    content: Buffer.from(bytes).toString("base64"),
  };
}

function notificationRecipients() {
  const explicit = (process.env.ADMIN_NOTIFY_EMAILS ?? "").split(",").map((email) => email.trim()).filter(Boolean);
  return explicit.length ? explicit : configuredAdminEmails();
}

/** Lets Paula know someone has completed a check-in. Answers stay in the admin area, not in the email. */
export async function sendAdminNotification({ participant, assessment, report, adminUrl }: { participant: ParticipantDetails; assessment: Assessment; report: PersonalReport; adminUrl?: string }) {
  const to = notificationRecipients();
  if (!to.length) return { status: "not-configured" as const };
  const name = `${participant.firstName} ${participant.lastName}`.trim();
  const priority = report.needsSupport ? "Priority: " : "";
  const subject = `${priority}${name} completed the ${assessment.shortName} (${report.result.overall}/100)`;
  const lines = [
    `${name} (${participant.email}) has completed the ${assessment.shortName}.`,
    `Result: ${report.result.overall}/100 — ${report.result.band.label}.`,
    report.focusArea ? `Main focus area: ${report.focusArea.name} (${report.focusArea.score}%).` : "",
    report.previous ? `Previous score: ${report.previous.overall}.` : "",
    participant.followUpConsent ? "They are happy for you to follow up." : "They have not asked for a follow-up — please only contact them about their report.",
    report.needsSupport ? "This result is in a band marked for support. Their result includes crisis signposting." : "",
  ].filter(Boolean);
  try {
    return await sendEmail({
      to,
      subject,
      text: `${lines.join("\n")}${adminUrl ? `\n\nView the full report: ${adminUrl}` : ""}`,
      html: `<div style="font-family:Montserrat,Arial,sans-serif;color:#444;font-size:15px;line-height:1.6">${lines.map((line) => `<p style="margin:0 0 10px">${escapeHtml(line)}</p>`).join("")}${adminUrl ? `<p><a href="${escapeHtml(adminUrl)}" style="color:#d94f25;font-weight:700">View the full report</a></p>` : ""}</div>`,
    });
  } catch (error) {
    console.error("Could not send admin notification", error);
    return { status: "failed" as const };
  }
}

export async function syncContactToCrm({ contactId, attemptId, participant, assessment, result }: {
  contactId?: string;
  attemptId: string;
  participant: ParticipantDetails;
  assessment: Assessment;
  result: AttemptResult;
}) {
  const webhookUrl = process.env.CRM_WEBHOOK_URL;
  if (!webhookUrl) return { status: "not-configured" as const };
  if (!participant.followUpConsent) return { status: "skipped" as const };
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(process.env.CRM_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.CRM_WEBHOOK_SECRET}` } : {}) },
      body: JSON.stringify({
        event: "assessment.completed",
        source: "absolute-mind-checkapp",
        attemptId,
        contactId,
        contact: participant,
        assessment: { slug: assessment.slug, name: assessment.name, shortName: assessment.shortName },
        result: { overall: result.overall, band: { id: result.band.id, label: result.band.label, title: result.band.title }, categoryScores: result.categoryScores },
      }),
    });
    if (!response.ok) return { status: "failed" as const };
    const data = await response.json().catch(() => null) as { id?: string; contactId?: string; externalId?: string } | null;
    return { status: "synced" as const, externalId: data?.externalId ?? data?.contactId ?? data?.id };
  } catch (error) {
    console.error("Could not sync contact to CRM", error);
    return { status: "failed" as const };
  }
}
