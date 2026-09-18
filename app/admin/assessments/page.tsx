import Link from "next/link";
import { AdminSidebar } from "@/src/components/admin-sidebar";
import { assessments } from "@/src/lib/seed-data";

export default function AssessmentsPage() {
  return <div className="admin-shell"><AdminSidebar active="Assessments" /><main className="admin-main"><div className="page-title"><div><div className="eyebrow">Content library</div><h1>Assessments</h1><p>Build, refine and publish the scorecards in your workspace.</p></div><Link className="button button-primary" href="/admin/assessments/new">+ New assessment</Link></div><div className="table-wrap"><div className="table-head"><span>Assessment</span><span>Status</span><span>Performance</span><span /></div>{assessments.map((assessment) => <div className="table-row" key={assessment.id}><div className="row-main"><div className="row-avatar">✦</div><div><strong>{assessment.name}</strong><span>/{assessment.slug} · {assessment.questionCount || "No"} questions</span></div></div><span><span className={`tag ${assessment.status === "DRAFT" ? "draft" : ""}`}>{assessment.status}</span></span><span>{assessment.completions ? `${assessment.completions} completions · ${assessment.conversionRate}% CTA` : "Not published"}</span><span className="kebab">···</span></div>)}</div></main></div>;
}
