"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { AnswerValues, Assessment, AttemptDelivery, ParticipantDetails, PersonalReport } from "@/src/lib/types";
import { isScorable } from "@/src/lib/scoring";
import { BrandMark } from "@/src/components/brand-mark";
import { SiteFooter } from "@/src/components/site-footer";

export function AssessmentRunner({ assessment }: { assessment: Assessment }) {
  const [step, setStep] = useState<"details" | "questions">("details");
  const [participant, setParticipant] = useState<ParticipantDetails | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [detailsError, setDetailsError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerValues>({});
  const [isSaving, setIsSaving] = useState(false);
  const question = assessment.questions[index];
  const answer = answers[question.id] ?? "";
  const canContinue = answer.trim() !== "" || (!isScorable(question) && Boolean(question.optional));
  const isLast = index === assessment.questions.length - 1;
  const progress = ((index + (answer.trim() ? 1 : 0)) / assessment.questions.length) * 100;
  const setAnswer = (value: string) => setAnswers((current) => ({ ...current, [question.id]: value }));

  const begin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const details: ParticipantDetails = {
      firstName: String(form.get("firstName") ?? "").trim(),
      lastName: String(form.get("lastName") ?? "").trim(),
      email: String(form.get("email") ?? "").trim().toLowerCase(),
      consent: form.get("consent") === "on",
      followUpConsent: form.get("followUpConsent") === "on",
    };
    if (!details.firstName || !details.lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email) || !details.consent) {
      setDetailsError("Please add your name, a valid email address and tick the consent box so we can create your report.");
      return;
    }
    setParticipant(details);
    setDetailsError("");
    setStep("questions");
  };

  const submit = async () => {
    if (!participant) return;
    setIsSaving(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/attempts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: assessment.slug, participant, answers, website: honeypot }) });
      const body = await response.json().catch(() => ({})) as Partial<AttemptDelivery> & { report?: PersonalReport; error?: string };
      if (!response.ok || !body.report) throw new Error(body.error ?? "We could not save your result. Please try again.");
      if (body.publicToken) {
        window.location.href = `/results/${body.publicToken}`;
        return;
      }
      const { report, ...delivery } = body;
      sessionStorage.setItem(`checkapp-report-${assessment.slug}`, JSON.stringify({ report, participant, delivery }));
      window.location.href = `/assessments/${assessment.slug}/results`;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We could not save your result. Please try again.");
      setIsSaving(false);
    }
  };

  const next = () => {
    if (!canContinue || isSaving) return;
    if (!isLast) setIndex((current) => current + 1);
    else void submit();
  };

  const category = assessment.categories.find((candidate) => candidate.id === question.categoryId);

  return <main className="assessment-shell"><header className="assessment-nav"><div className="container"><Link className="brand" href="/"><BrandMark /><span className="brand-sub">Check-ins</span></Link><small>{assessment.shortName} · Your answers are private</small></div></header><section className="runner-wrap container">
    {step === "details" ? <div className="question-card participant-card"><div className="eyebrow">Before we begin</div><h1>Where should we send your personalised report?</h1><p className="muted participant-intro">Add your details so we can save your result and send you the full report after your check-in.</p>
      <form onSubmit={begin}>
        <div className="participant-fields"><div className="field"><label htmlFor="firstName">First name</label><input id="firstName" name="firstName" autoComplete="given-name" maxLength={120} required /></div><div className="field"><label htmlFor="lastName">Last name</label><input id="lastName" name="lastName" autoComplete="family-name" maxLength={120} required /></div></div>
        <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" maxLength={120} required /><small className="field-hint">We’ll use this to send your personalised report.</small></div>
        <div className="honeypot" aria-hidden="true"><label htmlFor="website">Leave this empty</label><input id="website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} /></div>
        <label className="consent-row"><input name="consent" type="checkbox" required /><span>I consent to Absolute Mind using my answers — which may include information about my mental health — to create my personalised result and to email my report to me. <strong>Required.</strong></span></label>
        <label className="consent-row"><input name="followUpConsent" type="checkbox" /><span>Paula may contact me about my result, and my details can be kept in Absolute Mind’s client records. <em>Optional.</em></span></label>
        <p className="consent-note">You can ask for your data to be deleted at any time. See our <Link href="/privacy" target="_blank">privacy notice</Link>.</p>
        {detailsError && <p className="form-error" role="alert">{detailsError}</p>}
        <button className="button button-primary" type="submit">Start the check-in →</button>
      </form></div>
    : <><div className="runner-top"><span>Question {index + 1} of {assessment.questions.length}</span><span>{Math.round(progress)}% complete</span></div><div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><div className="progress-fill" style={{ width: `${Math.max(progress, 5)}%` }} /></div>
      <div className="question-card"><div className="eyebrow">{category?.name ?? "Your check-in"}</div><h1 id="question-prompt">{question.prompt}</h1>{question.helpText && <p className="muted question-help">{question.helpText}</p>}
        {isScorable(question)
          ? <div className="option-list" role="radiogroup" aria-labelledby="question-prompt">{question.options.map((option) => <button className={`answer-option ${answer === option.id ? "selected" : ""}`} key={option.id} type="button" role="radio" aria-checked={answer === option.id} onClick={() => setAnswer(option.id)}><span className="answer-radio" /><span>{option.label}</span></button>)}</div>
          : <div className="field"><textarea aria-labelledby="question-prompt" value={answer} maxLength={5000} onChange={(event) => setAnswer(event.target.value)} placeholder={question.optional ? "Optional — write whatever feels useful..." : "Write whatever feels useful..."} /></div>}
        {submitError && <p className="form-error" role="alert">{submitError}</p>}
        <div className="runner-actions">{index > 0 ? <button className="button button-ghost" type="button" disabled={isSaving} onClick={() => setIndex((current) => current - 1)}>← Back</button> : <span />}{canContinue && <button className="button button-primary" type="button" disabled={isSaving} onClick={next}>{isSaving ? "Saving your result…" : submitError ? "Try again →" : isLast ? "See my result →" : !answer.trim() ? "Skip →" : "Next question →"}</button>}</div>
      </div></>}
  </section><SiteFooter /></main>;
}
