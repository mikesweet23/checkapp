import Link from "next/link";
import { AdminSidebar } from "@/src/components/admin-sidebar";
import { requireAdmin } from "@/src/lib/admin-auth";
import { listAssessments } from "@/src/lib/assessment-repository";
import { isDatabaseConfigured } from "@/src/lib/persistence";
import { getPrisma } from "@/src/lib/prisma";
import { formatReportDate, supportBandIds } from "@/src/lib/scoring";

export const dynamic = "force-dynamic";

const deliveryLabel: Record<string, string> = { SENT: "Emailed", FAILED: "Email failed", NOT_CONFIGURED: "Email off", QUEUED: "Queued" };

export default async function ReportsPage() {
  await requireAdmin();
  const [attempts, assessments] = await Promise.all([
    isDatabaseConfigured() ? getPrisma().assessmentAttempt.findMany({ where: { status: "COMPLETED" }, orderBy: { completedAt: "desc" }, take: 100, include: { contact: true, assessment: true, emailEvents: { where: { type: "REPORT_EMAIL" }, orderBy: { createdAt: "desc" }, take: 1 } } }).catch(() => []) : Promise.resolve([]),
    listAssessments(),
  ]);
  const priorityBands = supportBandIds(assessments);
  return <div className="admin-shell"><AdminSidebar active="Reports" /><main className="admin-main"><div className="page-title"><div><div className="eyebrow">Delivery centre</div><h1>Reports</h1><p>Every completed check-in, with answers, delivery status and the PDF.</p></div></div>{attempts.length === 0 ? <section className="panel empty-state"><h2>No completed reports yet</h2><p>Completed check-ins will appear here so you can read the answers and download the report.</p></section> : <div className="table-wrap"><div className="table-head"><span>Participant</span><span>Check-in</span><span>Result</span><span>Delivery</span></div>{attempts.map((attempt: any) => { const email = attempt.emailEvents[0]; const priority = priorityBands.has(attempt.resultBandId); return <div className="table-row report-row" key={attempt.id}><Link href={`/admin/reports/${attempt.id}`}><strong>{[attempt.contact?.firstName, attempt.contact?.lastName].filter(Boolean).join(" ") || "Unnamed contact"}</strong><span>{attempt.contact?.email ?? "No email"}</span></Link><span>{attempt.assessment.shortName}<br /><small className="muted">{attempt.completedAt ? formatReportDate(attempt.completedAt) : ""}</small></span><span>{attempt.overallScore ?? "—"}/100 {priority && <span className="tag priority">Priority</span>}</span><span className="report-actions"><span className={`tag ${email?.status === "SENT" ? "" : "draft"}`}>{deliveryLabel[email?.status] ?? "Pending"}</span><Link className="button button-ghost" href={`/admin/reports/${attempt.id}`}>View</Link></span></div>; })}</div>}</main></div>;
}
