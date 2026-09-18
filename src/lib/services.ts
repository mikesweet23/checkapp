/**
 * Integration seams for the next increment. Keep platform behaviour independent
 * from any vendor so Postgres, email and CRM providers can be swapped safely.
 */
export async function queueResultEmail(_attemptId: string) {
  // TODO: persist an EmailEvent, then hand off to Resend/Postmark/SMTP.
  return { status: "queued" as const };
}

export async function generatePdfReport(_attemptId: string, _templateKey: string) {
  // TODO: render a PdfReportTemplate with the attempt's scores and result content.
  return { status: "not-configured" as const };
}

export async function syncContactToCrm(_contactId: string) {
  // TODO: resolve the workspace CRM provider and upsert CrmLinkage.
  return { status: "not-configured" as const };
}
