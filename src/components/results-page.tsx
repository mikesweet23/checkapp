"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ResultView } from "@/src/components/result-view";
import { SiteFooter } from "@/src/components/site-footer";
import { SiteHeader } from "@/src/components/site-header";
import type { Assessment, AttemptDelivery, ParticipantDetails, PersonalReport } from "@/src/lib/types";

type StoredResult = { report: PersonalReport; participant: ParticipantDetails; delivery: Partial<AttemptDelivery> };

/** Fallback results page used when there is no database, so no private link exists. */
export function ResultsPage({ assessment }: { assessment: Assessment }) {
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`checkapp-report-${assessment.slug}`);
      if (raw) setStored(JSON.parse(raw) as StoredResult);
    } catch {
      setStored(null);
    }
    setLoaded(true);
  }, [assessment.slug]);
  if (!loaded) return <main className="site-shell"><SiteHeader /></main>;
  if (!stored?.report) return <main className="site-shell"><SiteHeader /><section className="content-page container"><h1>Your result is not here yet.</h1><p className="lead">Complete the check-in first to see your personalised result. If you have already done it, use the link in your report email.</p><Link className="button button-primary" href={`/assessments/${assessment.slug}/run`}>Start the check-in →</Link></section><SiteFooter /></main>;
  return <ResultView assessment={assessment} participant={stored.participant} report={stored.report} delivery={stored.delivery} />;
}
