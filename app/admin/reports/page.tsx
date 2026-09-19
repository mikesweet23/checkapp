import Link from "next/link";
import { AdminSidebar } from "@/src/components/admin-sidebar";
import { requireAdmin } from "@/src/lib/admin-auth";
import { isDatabaseConfigured } from "@/src/lib/persistence";
import { getPrisma } from "@/src/lib/prisma";

export default async function ReportsPage() {
  await requireAdmin();
  const attempts = isDatabaseConfigured() ? await getPrisma().assessmentAttempt.findMany({ where: { status: "COMPLETED" }, orderBy: { completedAt: "desc" }, take: 100, include: { contact: true, assessment: true, emailEvents: { orderBy: { createdAt: "desc" }, take: 1 } } }).catch(() => []) : [];
  return <div className="admin-shell"><AdminSidebar active="Reports" /><main className="admin-main"><div className="page-title"><div><div className="eyebrow">Delivery centre</div><h1>Reports</h1><p>Track results, PDF generation and report email delivery.</p></div></div>{attempts.length === 0 ? <section className="panel empty-state"><h2>No completed reports yet</h2><p>Completed check-ins will appear here so you can download or resend a report.</p></section> : <div className="table-wrap"><div className="table-head"><span>Participant</span><span>Assessment</span><span>Result</span><span>Delivery</span></div>{attempts.map((attempt) => { const email = attempt.emailEvents[0]; return <div className="table-row report-row" key={attempt.id}><div><strong>{[attempt.contact?.firstName, attempt.contact?.lastName].filter(Boolean).join(" ") || "Unnamed contact"}</strong><span>{attempt.contact?.email ?? "No email"}</span></div><span>{attempt.assessment.shortName}</span><span>{attempt.overallScore ?? "—"}</span><span className="report-actions"><span className={`tag ${email?.status === "SENT" ? "" : "draft"}`}>{email?.status ?? "Pending"}</span><Link className="button button-ghost" href={`/api/admin/reports/${attempt.id}/pdf`}>PDF</Link></span></div>; })}</div>}</main></div>;
}
