import type { Assessment, AttemptResult, ParticipantDetails } from "./types";
import { createPdfReport } from "./pdf-report";

/**
 * Integration seams for the next increment. Keep platform behaviour independent
 * from any vendor so Postgres, email and CRM providers can be swapped safely.
 */
function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] ?? character);
}

export async function sendResultEmail({ participant, assessment, result }: {
  participant: ParticipantDetails;
  assessment: Assessment;
  result: AttemptResult;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REPORT_FROM_EMAIL;
  if (!apiKey || !from) return { status: "not-configured" as const };

  const firstName = escapeHtml(participant.firstName);
  const bandTitle = escapeHtml(result.band.title);
  const bandSummary = escapeHtml(result.band.summary);
  const bandBody = escapeHtml(result.band.body);
  const categoryRows = assessment.categories.map((category) => `<tr><td style="padding:10px 12px;border-bottom:1px solid #f1e5df;color:#5e4a51">${escapeHtml(category.name)}</td><td style="padding:10px 12px;border-bottom:1px solid #f1e5df;text-align:right;font-weight:700;color:#e76538">${result.categoryScores[category.id] ?? 0}%</td></tr>`).join("");
  const html = `<div style="background:#fffaf7;padding:32px 16px;font-family:Arial,sans-serif;color:#3e2d35"><div style="max-width:620px;margin:0 auto;background:white;border:1px solid #f1e5df;border-radius:18px;padding:32px"><p style="color:#e76538;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px">Absolute Mind · Personalised report</p><h1 style="font-size:30px;line-height:1.1;margin:16px 0 10px">${firstName}, here is your ${escapeHtml(assessment.shortName)} result</h1><p style="font-size:18px;margin:0 0 24px"><strong>${result.overall}/100</strong> · ${bandTitle}</p><p style="font-size:16px;line-height:1.6">${bandSummary}</p><p style="font-size:16px;line-height:1.6">${bandBody}</p><h2 style="font-size:20px;margin-top:28px">Your areas at a glance</h2><table style="width:100%;border-collapse:collapse;font-size:15px">${categoryRows}</table><p style="margin-top:28px"><a href="${escapeHtml(result.band.ctaHref)}" style="display:inline-block;background:#e76538;color:white;text-decoration:none;padding:13px 18px;border-radius:999px;font-weight:700">${escapeHtml(result.band.ctaLabel)}</a></p><p style="font-size:12px;line-height:1.5;color:#806c73;margin-top:28px">This check-in is for reflection and is not a diagnosis. If you feel at risk or need urgent support, contact an appropriate healthcare or emergency service.</p><p style="font-size:13px;line-height:1.5;color:#806c73;margin-top:22px">Your full branded report is attached as a PDF.</p></div></div>`;
  const text = `${participant.firstName}, your ${assessment.shortName} result is ${result.overall}/100 — ${result.band.title}.\n\n${result.band.summary}\n\n${result.band.body}\n\nYour areas:\n${assessment.categories.map((category) => `${category.name}: ${result.categoryScores[category.id] ?? 0}%`).join("\n")}\n\n${result.band.ctaLabel}: ${result.band.ctaHref}`;

  try {
    const pdf = await generatePdfReport({ participant, assessment, result });
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [participant.email], subject: `Your ${assessment.shortName} report from Absolute Mind`, html, text, attachments: [{ filename: pdf.filename, content: pdf.content }] }),
    });
    if (!response.ok) {
      console.error("Result email provider returned an error", response.status);
      return { status: "failed" as const, pdfStatus: "generated" as const };
    }
    const providerResponse = await response.json().catch(() => null) as { id?: string } | null;
    return { status: "sent" as const, pdfStatus: "generated" as const, providerId: providerResponse?.id };
  } catch (error) {
    console.error("Could not send result email", error);
    return { status: "failed" as const, pdfStatus: "failed" as const };
  }
}

export async function generatePdfReport({ participant, assessment, result }: { participant: ParticipantDetails; assessment: Assessment; result: AttemptResult }) {
  const bytes = await createPdfReport({ participant, assessment, result });
  return {
    status: "generated" as const,
    filename: `${assessment.slug}-report.pdf`,
    content: Buffer.from(bytes).toString("base64"),
  };
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
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "assessment.completed",
        source: "absolute-mind-checkapp",
        attemptId,
        contactId,
        contact: participant,
        assessment: { slug: assessment.slug, name: assessment.name, shortName: assessment.shortName },
        result: { overall: result.overall, band: result.band, categoryScores: result.categoryScores },
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
