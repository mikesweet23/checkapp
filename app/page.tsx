import Link from "next/link";
import { SiteFooter } from "@/src/components/site-footer";
import { SiteHeader } from "@/src/components/site-header";
import { listAssessments } from "@/src/lib/assessment-repository";
import { splitEmphasis } from "@/src/lib/text";

export const dynamic = "force-dynamic";

export default async function Home() {
  const live = (await listAssessments()).filter((assessment) => assessment.status === "LIVE" && assessment.questions.length > 0);
  return <main className="site-shell"><SiteHeader />
    <section className="hero container"><div className="eyebrow">Absolute Mind check-ins</div><h1>Understand what is <em>really going on</em></h1><p className="hero-copy">Short, thoughtful check-ins that help you notice the patterns behind how you feel — with a personalised report and a clear next step.</p></section>
    <section className="section container" id="check-ins"><div className="section-heading"><div><div className="eyebrow">Choose a check-in</div><h2>Where would you like to start?</h2></div></div>
      {live.length === 0 ? <p className="muted">New check-ins are on their way. In the meantime, visit <a className="text-link" href="https://absolutemind.co.uk">absolutemind.co.uk</a>.</p>
        : <div className="feature-grid">{live.map((assessment) => { const [plain, emphasis] = splitEmphasis(assessment.name); return <Link className="feature-card check-in-card" href={`/assessments/${assessment.slug}`} key={assessment.id}><div className="feature-number">{assessment.completionMinutes}′</div><h3>{plain} <em>{emphasis}</em></h3><p>{assessment.tagline}</p><span className="card-link">Begin →</span></Link>; })}</div>}
    </section>
    <section className="section container" id="how-it-works"><div className="section-heading"><div><div className="eyebrow">How it works</div><h2>Three calm steps</h2></div></div><div className="feature-grid">
      <div className="feature-card"><div className="feature-number">1</div><h3>Answer honestly</h3><p>A handful of simple questions, one at a time. There are no right or wrong answers.</p></div>
      <div className="feature-card"><div className="feature-number">2</div><h3>See your patterns</h3><p>Your result shows the areas asking for the most attention — and the strengths you can build on.</p></div>
      <div className="feature-card"><div className="feature-number">3</div><h3>Choose your next step</h3><p>You will receive a personalised PDF report and a clear, no-pressure next step from Paula.</p></div>
    </div></section><SiteFooter /></main>;
}
