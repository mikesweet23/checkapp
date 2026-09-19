"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { AnswerValues, Assessment, ParticipantDetails } from "@/src/lib/types";
import { calculateResult } from "@/src/lib/seed-data";
import { BrandMark } from "@/src/components/brand-mark";
import { SiteFooter } from "@/src/components/site-footer";

export function AssessmentRunner({ assessment }: { assessment: Assessment }) {
  const [step, setStep] = useState<"details" | "questions">("details");
  const [participant, setParticipant] = useState<ParticipantDetails | null>(null);
  const [detailsError, setDetailsError] = useState("");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerValues>({});
  const [isSaving, setIsSaving] = useState(false);
  const question = assessment.questions[index];
  const answer = answers[question.id];
  const progress = ((index + (answer !== undefined && answer !== "" ? 1 : 0)) / assessment.questions.length) * 100;
  const choose = (score: number) => setAnswers((current) => ({ ...current, [question.id]: score }));
  const begin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const details: ParticipantDetails = {
      firstName: String(form.get("firstName") ?? "").trim(),
      lastName: String(form.get("lastName") ?? "").trim(),
      email: String(form.get("email") ?? "").trim().toLowerCase(),
      consent: form.get("consent") === "on",
    };
    if (!details.firstName || !details.lastName || !details.email.includes("@") || !details.consent) {
      setDetailsError("Please add your name, a valid email address and consent to receive your report.");
      return;
    }
    setParticipant(details);
    sessionStorage.setItem(`checkapp-participant-${assessment.slug}`, JSON.stringify(details));
    setDetailsError("");
    setStep("questions");
  };
  const next = async () => {
    if (answer === undefined || answer === "" || !participant || isSaving) return;
    const finalAnswers = { ...answers, [question.id]: answer };
    if (index !== assessment.questions.length - 1) {
      setIndex((current) => current + 1);
      return;
    }
    setIsSaving(true);
    const result = calculateResult(assessment, finalAnswers);
    sessionStorage.setItem(`checkapp-result-${assessment.slug}`, JSON.stringify({ result, participant }));
    try {
      const response = await fetch("/api/attempts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: assessment.slug, participant, answers: finalAnswers }) });
      const delivery = await response.json();
      if (!response.ok) throw new Error(delivery.error ?? "Could not save your result");
      sessionStorage.setItem(`checkapp-delivery-${assessment.slug}`, JSON.stringify(delivery));
    } catch {
      sessionStorage.setItem(`checkapp-delivery-${assessment.slug}`, JSON.stringify({ mode: "database", emailStatus: "failed", databaseError: true }));
    }
    window.location.href = `/assessments/${assessment.slug}/results`;
  };
  return <main className="assessment-shell"><header className="assessment-nav"><div className="container"><Link className="brand" href="/"><BrandMark /> Absolute Mind <span className="brand-sub">Check-ins</span></Link><small>{assessment.shortName} · Your answers are private</small></div></header><section className="runner-wrap container">{step === "details" ? <div className="question-card participant-card"><div className="eyebrow">Before we begin</div><h1>Where should we send your personalised report?</h1><p className="muted participant-intro">Add your details so we can save your result and send you the full report after your check-in. Your information is only used for this assessment and your requested follow-up.</p><form onSubmit={begin}><div className="participant-fields"><div className="field"><label htmlFor="firstName">First name</label><input id="firstName" name="firstName" autoComplete="given-name" required /></div><div className="field"><label htmlFor="lastName">Last name</label><input id="lastName" name="lastName" autoComplete="family-name" required /></div></div><div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required /><small className="field-hint">We’ll use this to send your personalised report.</small></div><label className="consent-row"><input name="consent" type="checkbox" required /><span>I agree to receive my assessment result and report from Absolute Mind.</span></label>{detailsError && <p className="form-error" role="alert">{detailsError}</p>}<button className="button button-primary" type="submit">Start the check-in →</button></form></div> : <><div className="runner-top"><span>Question {index + 1} of {assessment.questions.length}</span><span>{Math.round(progress)}% complete</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${Math.max(progress, 5)}%` }} /></div><div className="question-card"><div className="eyebrow">{assessment.categories.find((category) => category.id === question.categoryId)?.name ?? "Your check-in"}</div><h1>{question.prompt}</h1>{question.helpText && <p className="muted" style={{ fontSize: 13, marginTop: -18, marginBottom: 25 }}>{question.helpText}</p>}{question.type === "TEXT" ? <div className="field"><textarea value={typeof answer === "string" ? answer : ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} placeholder="Write whatever feels useful..." /></div> : <div className="option-list">{question.options.map((option) => <button className={`answer-option ${answer === option.score ? "selected" : ""}`} key={option.id} type="button" onClick={() => choose(option.score)}><span className="answer-radio" /><span>{option.label}</span></button>)}</div>}<div className="runner-actions">{index > 0 ? <button className="button button-ghost" type="button" onClick={() => setIndex((current) => current - 1)}>← Back</button> : <span />}{answer !== undefined && answer !== "" && <button className="button button-primary" type="button" onClick={next}>{isSaving ? "Saving your result…" : index === assessment.questions.length - 1 ? "See my result →" : "Next question →"}</button>}</div></div></>}</section><SiteFooter /></main>;
}
