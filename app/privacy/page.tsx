import { SiteFooter } from "@/src/components/site-footer";
import { SiteHeader } from "@/src/components/site-header";
import { SupportPanel } from "@/src/components/support-panel";
import { privacyContactEmail, retentionMonths } from "@/src/lib/support";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacy | Absolute Mind Check-ins",
  description: "How Absolute Mind uses information submitted through its check-ins.",
};

export default function PrivacyPage() {
  const email = privacyContactEmail();
  const months = retentionMonths();
  return <main className="site-shell"><SiteHeader /><section className="content-page container"><div className="eyebrow">Absolute Mind Check-ins</div><h1>Privacy and your check-in</h1><p className="lead">Your answers can say a lot about how you are feeling, so we treat them with care. This notice explains what we collect, why, and the choices you have.</p><div className="content-card">
    <h2>Who we are</h2><p>These check-ins are provided by Absolute Mind (Paula). Absolute Mind is responsible for the information you share here. You can contact us about your data at <a href={`mailto:${email}`}>{email}</a>.</p>
    <h2>What we collect</h2><p>Your first name, last name and email address, the answers you give, anything you choose to write in your own words, and the scores and result we calculate from them. We also record when you gave consent.</p>
    <h2>Why this is sensitive, and our lawful basis</h2><p>Answers about anxiety, mood or wellbeing can count as health information, which UK data protection law treats as special category data. We only process it with your explicit consent, which you give by ticking the required box before you start. Sending your report is based on that same consent.</p>
    <h2>How we use it</h2><p>To calculate your result, show you your private results page and email your personalised PDF report. Paula is notified when a check-in is completed so she can see results in a private admin area. If — and only if — you tick the optional follow-up box, Paula may contact you about your result and your details may be added to Absolute Mind’s client records. We do not sell your information or use it for advertising.</p>
    <h2>Who else handles it</h2><p>We use trusted service providers to run the check-ins on our behalf: website hosting, a secure database and an email delivery service. They only process your information on our instructions.</p>
    <h2>Your private results link</h2><p>Your results page has a long, unguessable link that is only shared with you by email. Anyone you forward that link to will be able to see your result, so please keep it private.</p>
    <h2>How long we keep it</h2><p>We keep check-in results for {months} months after completion, then delete them automatically. You can ask us to delete them sooner at any time.</p>
    <h2>Your rights</h2><p>You can ask to see the information we hold about you, have it corrected or deleted, or withdraw your consent at any time by emailing <a href={`mailto:${email}`}>{email}</a>. Withdrawing consent does not affect anything we did before you withdrew it. If you are unhappy with how we have handled your information, you can complain to the Information Commissioner’s Office at <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noreferrer">ico.org.uk</a>.</p>
    <p className="muted">These check-ins are for reflection and are not a diagnosis or a substitute for professional medical advice.</p>
  </div><div className="content-narrow"><SupportPanel /></div></section><SiteFooter /></main>;
}
