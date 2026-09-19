"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/src/components/site-header";
import { SiteFooter } from "@/src/components/site-footer";
import type { Assessment, AttemptDelivery, AttemptResult, ParticipantDetails } from "@/src/lib/types";

export function ResultsPage({ assessment }: { assessment: Assessment }) {
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [participant, setParticipant] = useState<ParticipantDetails | null>(null);
  const [delivery, setDelivery] = useState<AttemptDelivery | null>(null);
  useEffect(() => {
    const stored = sessionStorage.getItem(`checkapp-result-${assessment.slug}`);
    if (stored) {
      const parsed = JSON.parse(stored) as AttemptResult | { result: AttemptResult; participant: ParticipantDetails };
      if ("result" in parsed) { setResult(parsed.result); setParticipant(parsed.participant); } else setResult(parsed);
    }
    const storedParticipant = sessionStorage.getItem(`checkapp-participant-${assessment.slug}`);
    if (storedParticipant) setParticipant(JSON.parse(storedParticipant));
    const storedDelivery = sessionStorage.getItem(`checkapp-delivery-${assessment.slug}`);
    if (storedDelivery) setDelivery(JSON.parse(storedDelivery));
  }, [assessment.slug]);
  if (!result) return <main className="site-shell"><SiteHeader /><div className="container" style={{ padding: "100px 0" }}><h1 className="serif">Your result is ready.</h1><p className="muted">Complete the check-in first to see your personalised result.</p><Link className="button button-primary" href={`/assessments/${assessment.slug}/run`}>Start the check-in →</Link></div></main>;
  const titleWords = result.band.title.split(" ");
  const reportMessage = delivery?.databaseError ? "We could not save your result. Please try the check-in again or contact Absolute Mind for help." : delivery?.emailStatus === "sent" && delivery.pdfStatus === "generated" ? `Your full PDF report has been sent to ${participant?.email}.` : delivery?.emailStatus === "sent" ? `Your report has been sent to ${participant?.email}.` : delivery?.emailStatus === "failed" ? "We could not send the report automatically. Please contact Absolute Mind for help." : "Your result is ready. Report delivery will be confirmed by email.";
  return <main className="assessment-shell"><SiteHeader /><section className="result-hero container"><div className="result-grid"><div><div className="eyebrow">Your personalised result</div><h1>{titleWords.slice(0, -2).join(" ")} <em>{titleWords.slice(-2).join(" ")}</em></h1><div className="result-band">{result.band.label}</div><p>{result.band.summary}</p><a className="button button-primary" href={result.band.ctaHref}>{result.band.ctaLabel} <span>→</span></a></div><div><div className="result-orb"><div className="result-orb-inner"><strong>{result.overall}</strong><span>out of 100</span></div></div></div></div>{participant && <div className="report-notice"><strong>{participant.firstName}, your report is on its way.</strong><span>{reportMessage}</span></div>}</section><section className="result-content container"><div className="result-content-grid"><div><article className="result-panel"><h2>A little more context</h2><p>{result.band.body}</p><div className="category-grid">{assessment.categories.map((category) => <div className="category-score" key={category.id}><div><span>{category.name}</span><span>{result.categoryScores[category.id] ?? 0}%</span></div><div className="metric-bar"><div className="metric-fill" style={{ width: `${result.categoryScores[category.id] ?? 0}%`, background: category.color }} /></div><small>{category.description}</small></div>)}</div></article></div><aside className="result-panel dark"><div className="eyebrow">Your next step</div><h2>{result.band.videoTitle}</h2><p>{result.band.videoDescription}</p><div className="video-placeholder"><div className="play-button">▶</div></div><a className="button button-primary" href={result.band.ctaHref}>{result.band.ctaLabel} →</a></aside></div></section><SiteFooter /></main>;
}
