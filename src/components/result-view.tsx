import type { CSSProperties } from "react";
import { SiteFooter } from "@/src/components/site-footer";
import { SiteHeader } from "@/src/components/site-header";
import { SupportPanel } from "@/src/components/support-panel";
import { formatReportDate, progressSentence } from "@/src/lib/scoring";
import { reflectionDisclaimer } from "@/src/lib/support";
import type { Assessment, AttemptDelivery, ParticipantDetails, PersonalReport } from "@/src/lib/types";
import { splitEmphasis, videoEmbedUrl } from "@/src/lib/text";

function deliveryMessage(participant: ParticipantDetails | null, delivery: Partial<AttemptDelivery> | null, isSavedLink: boolean) {
  const name = participant?.firstName ? `${participant.firstName}, ` : "";
  if (delivery?.databaseError) return { tone: "warning", title: `${name}we could not save your result.`, body: "Your answers are shown below, but please try the check-in again or contact Absolute Mind so we can help." };
  if (delivery?.emailStatus === "sent") return { tone: "ok", title: isSavedLink ? "This is your private results page." : `${name}your report is on its way.`, body: `${isSavedLink ? "A copy of your full PDF report was emailed" : "We have emailed your full PDF report"} to ${participant?.email ?? "you"}.${isSavedLink ? "" : " Keep this page's link if you would like to come back to it."}` };
  if (delivery?.emailStatus === "failed") return { tone: "warning", title: `${name}we could not email your report automatically.`, body: `Your full result is below${isSavedLink ? " and this page's link is yours to keep" : ""}. Please contact Absolute Mind and we will send your PDF report to you.` };
  return { tone: "ok", title: `${name}your result is ready.`, body: isSavedLink ? "This is your private results page — keep its link if you would like to come back to it." : "Your full result is below." };
}

export function ResultView({ assessment, participant, report, delivery, isSavedLink = false }: {
  assessment: Assessment;
  participant: ParticipantDetails | null;
  report: PersonalReport;
  delivery: Partial<AttemptDelivery> | null;
  isSavedLink?: boolean;
}) {
  const { result } = report;
  const band = result.band;
  const [plainTitle, emphasisedTitle] = splitEmphasis(band.title);
  const notice = deliveryMessage(participant, delivery, isSavedLink);
  const progress = progressSentence(report);
  const embed = band.videoUrl ? videoEmbedUrl(band.videoUrl) : null;
  const orbStyle = { "--score": `${result.overall}%` } as CSSProperties;

  return <main className="assessment-shell"><SiteHeader />
    <section className="result-hero container"><div className="result-grid"><div>
      <div className="eyebrow">{participant?.firstName ? `${participant.firstName}'s personalised result` : "Your personalised result"} · {formatReportDate(report.completedAt)}</div>
      <h1>{plainTitle} <em>{emphasisedTitle}</em></h1>
      <div className="result-band">{band.label}</div>
      <p>{band.summary}</p>
      <a className="button button-primary" href={band.ctaHref}>{band.ctaLabel} <span aria-hidden="true">→</span></a>
    </div><div><div className="result-orb" style={orbStyle} role="img" aria-label={`Your score is ${result.overall} out of 100`}><div className="result-orb-inner"><strong>{result.overall}</strong><span>out of 100</span></div></div></div></div>
    <div className={`report-notice ${notice.tone === "warning" ? "warning" : ""}`} role="status"><strong>{notice.title}</strong><span>{notice.body}</span></div>
    {report.needsSupport && <SupportPanel emphasised />}
    </section>

    <section className="result-content container">
      {progress && <p className="progress-note">{progress}</p>}
      {(report.focusArea || report.strength) && <div className="highlight-grid">
        {report.focusArea && <article className="highlight-card focus"><div className="eyebrow">Your main focus area</div><h2>{report.focusArea.name}</h2><p>{report.focusArea.insight || report.focusArea.description}</p></article>}
        {report.strength && <article className="highlight-card"><div className="eyebrow">Your strongest area</div><h2>{report.strength.name}</h2><p>{report.strength.insight || report.strength.description}</p></article>}
      </div>}

      <div className="result-content-grid"><div className="result-stack">
        <article className="result-panel"><h2>A little more context</h2><p>{band.body}</p>
          {report.categories.length > 0 && <div className="category-grid">{report.categories.map((category) => <div className="category-score" key={category.id}>
            <div><span>{category.name}</span><span>{category.score}%</span></div>
            <div className="metric-bar"><div className="metric-fill" style={{ width: `${category.score}%`, background: category.color }} /></div>
            {category.id === report.focusArea?.id && <span className="category-tag">Main focus</span>}
            {category.id === report.strength?.id && <span className="category-tag calm">Strongest area</span>}
            <small>{category.insight || category.description}</small>
          </div>)}</div>}
        </article>
        {report.answerInsights.length > 0 && <article className="result-panel"><h2>Things you told us</h2><ul className="insight-list">{report.answerInsights.map((insight) => <li key={insight.questionId}><span className="insight-answer">{insight.prompt} <strong>{insight.answerLabel}</strong></span><p>{insight.insight}</p></li>)}</ul></article>}
        {report.writtenAnswers.length > 0 && <article className="result-panel"><h2>In your words</h2>{report.writtenAnswers.map((answer) => <blockquote className="written-answer" key={answer.prompt}><span>{answer.prompt}</span><p>{answer.text}</p></blockquote>)}</article>}
        {assessment.signOff?.message && <article className="result-panel sign-off"><p>{assessment.signOff.message}</p><strong>{assessment.signOff.name}</strong></article>}
      </div>
      <aside className="result-panel dark"><div className="eyebrow">Your next step</div><h2>{band.videoTitle || band.title}</h2>{band.videoDescription && <p>{band.videoDescription}</p>}
        {embed ? <div className="video-frame"><iframe src={embed} title={band.videoTitle || "Video from Absolute Mind"} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen loading="lazy" /></div>
          : band.videoUrl ? <a className="video-link" href={band.videoUrl} target="_blank" rel="noreferrer">Watch the video ↗</a> : null}
        {band.pdf?.nextStep && band.pdf.nextStep !== band.body && <p>{band.pdf.nextStep}</p>}
        <a className="button button-primary" href={band.ctaHref}>{band.ctaLabel} →</a>
      </aside></div>

      {!report.needsSupport && <SupportPanel />}
      <p className="disclaimer">{reflectionDisclaimer}</p>
    </section><SiteFooter /></main>;
}
