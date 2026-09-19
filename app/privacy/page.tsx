import { SiteFooter } from "@/src/components/site-footer";
import { SiteHeader } from "@/src/components/site-header";

export const metadata = {
  title: "Privacy | Absolute Mind Check-ins",
  description: "How Absolute Mind uses information submitted through its check-ins.",
};

export default function PrivacyPage() {
  return <main className="site-shell"><SiteHeader /><section className="content-page container"><div className="eyebrow">Absolute Mind Check-ins</div><h1>Privacy and your check-in</h1><p className="lead">We use the details you provide to save your result and send the personalised report you requested.</p><div className="content-card"><h2>What we collect</h2><p>Your first name, last name, email address, answers and resulting scores. We only ask for information needed to provide the assessment and follow-up.</p><h2>How we use it</h2><p>Your details are used to calculate your result, send your report and, where configured, create or update your contact record in the Absolute Mind CRM.</p><h2>Questions or requests</h2><p>For a correction, deletion request or any privacy question, contact Paula at <a href="mailto:paula@paulasweet.co.uk">paula@paulasweet.co.uk</a>.</p><p className="muted">This check-in is for reflection and is not a diagnosis or a substitute for professional medical advice.</p></div></section><SiteFooter /></main>;
}
