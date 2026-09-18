"use client";

import Link from "next/link";
import { useState } from "react";
import type { Assessment } from "@/src/lib/types";
import { calculateResult } from "@/src/lib/seed-data";

export function AssessmentRunner({ assessment }: { assessment: Assessment }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const question = assessment.questions[index];
  const answer = answers[question.id];
  const progress = ((index + (answer !== undefined ? 1 : 0)) / assessment.questions.length) * 100;
  const choose = (score: number) => setAnswers((current) => ({ ...current, [question.id]: score }));
  const next = () => { if (answer === undefined) return; if (index === assessment.questions.length - 1) { const result = calculateResult(assessment, answers); sessionStorage.setItem(`checkapp-result-${assessment.slug}`, JSON.stringify(result)); window.location.href = `/assessments/${assessment.slug}/results`; } else setIndex((current) => current + 1); };
  return <main className="assessment-shell"><header className="assessment-nav"><div className="container"><Link className="brand" href="/"><span className="brand-mark"><span>✦</span></span> checkapp</Link><small>{assessment.shortName} · Your answers are private</small></div></header><section className="runner-wrap container"><div className="runner-top"><span>Question {index + 1} of {assessment.questions.length}</span><span>{Math.round(progress)}% complete</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${Math.max(progress, 5)}%` }} /></div><div className="question-card"><div className="eyebrow">{assessment.categories.find((category) => category.id === question.categoryId)?.name}</div><h1>{question.prompt}</h1>{question.helpText && <p className="muted" style={{ fontSize: 13, marginTop: -18, marginBottom: 25 }}>{question.helpText}</p>}<div className="option-list">{question.options.map((option) => <button className={`answer-option ${answer === option.score ? "selected" : ""}`} key={option.id} type="button" onClick={() => choose(option.score)}><span className="answer-radio" /><span>{option.label}</span></button>)}</div><div className="runner-actions">{index > 0 ? <button className="button button-ghost" type="button" onClick={() => setIndex((current) => current - 1)}>← Back</button> : <span />}{answer !== undefined && <button className="button button-primary" type="button" onClick={next}>{index === assessment.questions.length - 1 ? "See my result →" : "Next question →"}</button>}</div></div></section></main>;
}
