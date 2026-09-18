import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/src/components/site-header";
import { getAssessment } from "@/src/lib/seed-data";

export default async function AssessmentLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const assessment = getAssessment(slug);
  if (!assessment || assessment.status !== "LIVE") notFound();
  const titleWords = assessment.name.split(" ");
  return <main className="assessment-shell"><SiteHeader /><section className="assessment-landing container"><div className="assessment-landing-grid"><div><div className="eyebrow">A gentle 3-minute check-in</div><h1>{titleWords.slice(0, 3).join(" ")} <em>{titleWords.slice(3).join(" ")}</em></h1><p className="lead">{assessment.description}</p><Link className="button button-primary" href={`/assessments/${assessment.slug}/run`}>Begin your check-in <span>→</span></Link><div className="trust-line"><span className="trust-check">✓</span> Private, thoughtful and completely free</div></div><div className="assessment-visual"><div className="visual-card"><div className="visual-card-top"><span className="brand-mark"><span>✦</span></span><span>Absolute Mind · Check-in</span></div><h3>Let's start with how things feel for you.</h3><p>There are no right or wrong answers. Choose the response that feels closest to your experience.</p><div className="visual-question"><span>Question 1 of {assessment.questionCount}</span><div className="fake-option"><span className="fake-radio" />Almost never</div><div className="fake-option"><span className="fake-radio" />Occasionally</div><div className="fake-option"><span className="fake-radio" />Often</div></div></div></div></div><div className="fact-row"><div className="fact"><strong>{assessment.questionCount}</strong><span>simple questions</span></div><div className="fact"><strong>{assessment.completionMinutes} min</strong><span>to a clearer picture</span></div><div className="fact"><strong>100%</strong><span>private & judgement-free</span></div></div></section></main>;
}
