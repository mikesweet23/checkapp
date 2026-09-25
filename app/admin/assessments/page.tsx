import Link from "next/link";
import { AdminSidebar } from "@/src/components/admin-sidebar";
import { listAssessments } from "@/src/lib/assessment-repository";
import { requireAdmin } from "@/src/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AssessmentsPage() {
  await requireAdmin();
  const assessments = await listAssessments();
  return <div className="admin-shell"><AdminSidebar active="Assessments" /><main className="admin-main"><div className="page-title"><div><div className="eyebrow">Content library</div><h1>Assessments</h1><p>Build, refine and publish the scorecards in your workspace.</p></div><Link className="button button-primary" href="/admin/assessments/new">+ New assessment</Link></div><div className="table-wrap"><div className="table-head"><span>Assessment</span><span>Status</span><span>Performance</span><span>Actions</span></div>{assessments.map((assessment) => <div className="table-row" key={assessment.id}><Link className="row-main" href={`/admin/assessments/${assessment.id}`}><div className="row-avatar">✦</div><div><strong>{assessment.name}</strong><span>/{assessment.slug} · {assessment.questionCount || "No"} questions</span></div></Link><span><span className={`tag ${assessment.status === "DRAFT" ? "draft" : ""}`}>{assessment.status}</span></span><span>{assessment.completions ? `${assessment.completions} completion${assessment.completions === 1 ? "" : "s"}` : assessment.status === "LIVE" ? "No completions yet" : "Not published"}</span><Link className="button button-ghost table-action" href={`/admin/assessments/${assessment.id}`}>Edit →</Link></div>)}</div></main></div>;
}
