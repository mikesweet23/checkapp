"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { SiteHeader } from "@/src/components/site-header";
import { SiteFooter } from "@/src/components/site-footer";
import { getAssessment } from "@/src/lib/seed-data";
import type { AttemptDelivery, AttemptResult, ParticipantDetails } from "@/src/lib/types";

export default function ResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const assessment = getAssessment(slug);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [participant, setParticipant] = useState<ParticipantDetails | null>(null);
  const [delivery, setDelivery] = useState<AttemptDelivery | null>(null);
  useEffect(() => {
    const stored = sessionStorage.getItem(`checkapp-result-${slug}`);
    if (stored) {
      const parsed = JSON.parse(stored) as AttemptResult | { result: AttemptResult; participant: ParticipantDetails };
      if ("result" in parsed) { setResult(parsed.result); setParticipant(parsed.participant); } else setResult(parsed);
    }
    const storedParticipant = sessionStorage.getItem(`checkapp-participant-${slug}`);
    if (storedParticipant) setParticipant(JSON.parse(storedParticipant));
    const storedDelivery = sessionStorage.getItem(`checkapp-delivery-${slug}`);
    if (storedDelivery) setDelivery(JSON.parse(storedDelivery));
  }, [slug]);
  if (!assessment) return null;
  if (!result) return <main className="site-shell"><SiteHeader /><div className="container" style={{ padding: "100px 0" }}><h1 className="serif">Your result is ready.</h1><p className="muted">Complete the check-in first to see your personalised result.</p><Link className="button button-primary" href={`/assessments/${assessment.slug}/run`}>Start the check-in →</Link></div></main>;
  const titleWords = result.band.title.split(" ");
  return <main className="assessment-shell"><SiteHeader /><section className="result-hero container"><div className="result-grid"><div><div className="eyebrow">Your personalised result</div><h1>{titleWords.slice(0, -2).join(" ")} <em>{titleWords.slice(-2).join(" ")}</em></h1><div className="result-band">{result.band.label}</div><p>{result.band.summary}</p><a className="button button-primary" href={result.band.ctaHref}>{result.band.ctaLabel} <span>→</span></a></div><div><div className="result-orb"><div className="result-orb-inner"><strong>{result.overall}</strong><span>out of 100</span></div></div></div></div>{participant && <div className="report-notice"><strong>{participant.firstName}, your report is on its way.</strong><span>{delivery?.emailStatus === "sent" || delivery?.emailStatus === "failed" ? `We’re sending the full report to ${participant.email}.` : `Your result is ready. Report delivery will be connected for ${participant.email}.`}</span></div>}</section><section className="result-content container"><div className="result-content-grid"><div><article className="result-panel"><h2>A little more context</h2><p>{result.band.body}</p><div className="category-grid">{assessment.categories.map((category) => <div className="category-score" key={category.id}><div><span>{category.name}</span><span>{result.categoryScores[category.id]}%</span></div><div className="metric-bar"><div className="metric-fill" style={{ width: `${result.categoryScores[category.id]}%`, background: category.color }} /></div><small>{category.description}</small></div>)}</div></article></div><aside className="result-panel dark"><div className="eyebrow">A note from Paula</div><h2>{result.band.videoTitle}</h2><p>{result.band.videoDescription}</p><div className="video-placeholder"><div className="play-button">▶</div></div><a className="button button-primary" href={result.band.ctaHref}>{result.band.ctaLabel} →</a></aside></div></section><SiteFooter /></main>;
}
