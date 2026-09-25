import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/src/components/site-header";
import { SiteFooter } from "@/src/components/site-footer";
import { BrandMark } from "@/src/components/brand-mark";
import { getAssessmentForPublic } from "@/src/lib/assessment-repository";
import { isScorable } from "@/src/lib/scoring";
import { splitEmphasis } from "@/src/lib/text";

export default async function AssessmentLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const assessment = await getAssessmentForPublic(slug);
  if (!assessment || assessment.status !== "LIVE" || !assessment.questions.length) notFound();
  const [plainTitle, emphasisedTitle] = splitEmphasis(assessment.name);
  const preview = assessment.questions.find(isScorable);
  const questionCount = assessment.questions.length;
  return <main className="assessment-shell"><SiteHeader /><section className="assessment-landing container"><div className="assessment-landing-grid"><div><div className="eyebrow">A gentle {assessment.completionMinutes}-minute check-in</div><h1>{plainTitle} <em>{emphasisedTitle}</em></h1><p className="lead">{assessment.description}</p><Link className="button button-primary" href={`/assessments/${assessment.slug}/run`}>Begin your check-in <span aria-hidden="true">→</span></Link><div className="trust-line"><span className="trust-check">✓</span> Private, thoughtful and completely free</div></div><div className="assessment-visual"><div className="visual-card"><div className="visual-card-top"><BrandMark /><span>Check-in</span></div><h3>Let's start with how things feel for you.</h3><p>There are no right or wrong answers. Choose the response that feels closest to your experience.</p>{preview && <div className="visual-question"><span>Question 1 of {questionCount}</span>{preview.options.slice(0, 3).map((option) => <div className="fake-option" key={option.id}><span className="fake-radio" />{option.label}</div>)}</div>}</div></div></div><div className="fact-row"><div className="fact"><strong>{questionCount}</strong><span>simple question{questionCount === 1 ? "" : "s"}</span></div><div className="fact"><strong>{assessment.completionMinutes} min</strong><span>to a clearer picture</span></div><div className="fact"><strong>100%</strong><span>private & judgement-free</span></div></div></section><SiteFooter /></main>;
}
