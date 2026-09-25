import Link from "next/link";
import { AdminSidebar } from "@/src/components/admin-sidebar";
import { listAssessments } from "@/src/lib/assessment-repository";
import { requireAdmin } from "@/src/lib/admin-auth";
import { isDatabaseConfigured } from "@/src/lib/persistence";
import { getPrisma } from "@/src/lib/prisma";
import { formatReportDate, supportBandIds } from "@/src/lib/scoring";

export const dynamic = "force-dynamic";

function greeting() {
  const hour = Number(new Date().toLocaleString("en-GB", { timeZone: "Europe/London", hour: "numeric", hour12: false }));
  return hour < 12 ? "Good morning." : hour < 18 ? "Good afternoon." : "Good evening.";
}

async function workspaceStats() {
  if (!isDatabaseConfigured()) return null;
  const prisma = getPrisma();
  try {
    const [completions, contacts, recent] = await Promise.all([
      prisma.assessmentAttempt.count({ where: { status: "COMPLETED" } }),
      prisma.contact.count(),
      prisma.assessmentAttempt.findMany({ where: { status: "COMPLETED" }, orderBy: { completedAt: "desc" }, take: 6, include: { contact: true, assessment: true } }),
    ]);
    return { completions, contacts, recent };
  } catch (error) {
    console.error("Could not load dashboard stats", error);
    return null;
  }
}

export default async function AdminDashboard() {
  await requireAdmin();
  const [assessments, stats] = await Promise.all([listAssessments(), workspaceStats()]);
  const live = assessments.filter((assessment) => assessment.status === "LIVE");
  const priorityBands = supportBandIds(assessments);
  const priorityCount = stats?.recent.filter((attempt: any) => priorityBands.has(attempt.resultBandId)).length ?? 0;
  return <div className="admin-shell"><AdminSidebar active="Overview" /><main className="admin-main"><div className="admin-top"><div><div className="eyebrow">Private workspace</div><h1>{greeting()}</h1><p>Here is how your check-ins are doing.</p></div><div className="admin-actions"><Link className="button button-ghost" href="/" target="_blank">View public site ↗</Link><Link className="button button-primary" href="/admin/assessments/new">+ New assessment</Link></div></div>
    {!stats && <p className="admin-notice">The database is not connected, so completions and contacts are not being saved yet.</p>}
    <div className="stat-grid"><div className="stat-card"><p>Live check-ins</p><strong>{live.length}</strong></div><div className="stat-card"><p>Total completions</p><strong>{stats ? stats.completions : "—"}</strong></div><div className="stat-card"><p>Contacts</p><strong>{stats ? stats.contacts : "—"}</strong></div><div className="stat-card"><p>Priority results (recent)</p><strong>{stats ? priorityCount : "—"}</strong></div></div>
    <div className="dashboard-grid"><section className="panel"><div className="panel-heading"><h2>Your check-ins</h2><Link href="/admin/assessments">View all →</Link></div>{assessments.map((assessment) => <Link className="assessment-row" href={`/admin/assessments/${assessment.id}`} key={assessment.id}><div className="row-main"><div className="row-avatar">✦</div><div><strong>{assessment.name}</strong><span>{assessment.questionCount || "No"} questions · Updated {assessment.updatedAt}</span></div></div><span className={`tag ${assessment.status === "DRAFT" ? "draft" : ""}`}>{assessment.status}</span></Link>)}</section>
    <section className="panel"><div className="panel-heading"><h2>Latest completions</h2><Link href="/admin/reports">All reports →</Link></div>{stats?.recent.length ? stats.recent.map((attempt: any) => <Link className="activity-row" href={`/admin/reports/${attempt.id}`} key={attempt.id}><div className={`activity-dot ${priorityBands.has(attempt.resultBandId) ? "priority" : ""}`} /><div><p><strong>{[attempt.contact?.firstName, attempt.contact?.lastName].filter(Boolean).join(" ") || "Unnamed contact"}</strong> · {attempt.assessment.shortName} · {attempt.overallScore}/100{priorityBands.has(attempt.resultBandId) && <span className="tag priority inline">Priority</span>}</p><span>{attempt.completedAt ? formatReportDate(attempt.completedAt) : ""}</span></div></Link>) : <div className="activity-row"><div className="activity-dot" /><div><p><strong>No completions yet</strong></p><span>Complete the public link yourself to test the report and email.</span></div></div>}</section></div></main></div>;
}
