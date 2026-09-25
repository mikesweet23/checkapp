import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminSidebar } from "@/src/components/admin-sidebar";
import { requireAdmin } from "@/src/lib/admin-auth";
import { loadAttempt } from "@/src/lib/attempt-report";
import { formatReportDate, progressSentence } from "@/src/lib/scoring";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const attempt = await loadAttempt({ id }).catch(() => null);
  if (!attempt) notFound();
  const { participant, report, assessment } = attempt;
  const progress = progressSentence(report);
  return <div className="admin-shell"><AdminSidebar active="Reports" /><main className="admin-main">
    <div className="page-title"><div><div className="eyebrow">{assessment.shortName} · {formatReportDate(report.completedAt)}</div><h1>{participant.firstName} {participant.lastName}</h1><p><a className="text-link" href={`mailto:${participant.email}`}>{participant.email}</a></p></div><div className="admin-actions"><Link className="button button-ghost" href="/admin/reports">← All reports</Link><a className="button button-ghost" href={`/api/admin/reports/${attempt.attemptId}/pdf`}>Download PDF</a>{attempt.publicToken && <a className="button button-primary" href={`/results/${attempt.publicToken}`} target="_blank" rel="noreferrer">Their results page ↗</a>}</div></div>
    {report.needsSupport && <p className="admin-notice priority">This result is in a band marked for support. Their results page, email and PDF include crisis signposting.</p>}
    <div className="stat-grid"><div className="stat-card"><p>Overall score</p><strong>{report.result.overall}/100</strong></div><div className="stat-card"><p>Result band</p><strong className="stat-text">{report.result.band.label}</strong></div><div className="stat-card"><p>Follow-up</p><strong className="stat-text">{participant.followUpConsent ? "Happy to be contacted" : "Report only"}</strong></div><div className="stat-card"><p>Delivery</p><strong className="stat-text">{attempt.emailStatus === "SENT" ? "Emailed" : attempt.emailStatus === "FAILED" ? "Email failed" : "Not emailed"}{attempt.crmSynced ? " · CRM" : ""}</strong></div></div>
    <div className="dashboard-grid"><section className="panel"><div className="panel-heading"><h2>Their answers</h2></div>{attempt.answers.map((answer, index) => <div className="answer-row" key={answer.questionId}><span className="answer-number">{index + 1}</span><div><p>{answer.prompt}</p><strong>{answer.answer || "—"}</strong></div>{answer.score != null && <span className="answer-score">{answer.score}</span>}</div>)}</section>
    <section className="panel"><div className="panel-heading"><h2>Areas</h2></div>{report.categories.map((category) => <div className="category-score compact" key={category.id}><div><span>{category.name}{category.id === report.focusArea?.id ? " · focus" : category.id === report.strength?.id ? " · strength" : ""}</span><span>{category.score}%</span></div><div className="metric-bar"><div className="metric-fill" style={{ width: `${category.score}%`, background: category.color }} /></div></div>)}
      {progress && <p className="muted small-copy">{progress}</p>}
      {attempt.otherAttempts.length > 0 && <><div className="panel-heading spaced"><h2>Other check-ins</h2></div>{attempt.otherAttempts.map((other) => <Link className="activity-row" href={`/admin/reports/${other.id}`} key={other.id}><div className="activity-dot" /><div><p><strong>{other.overall ?? "—"}/100</strong></p><span>{formatReportDate(other.completedAt)}</span></div></Link>)}</>}
    </section></div>
  </main></div>;
}
