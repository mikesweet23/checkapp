"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminSidebar } from "@/src/components/admin-sidebar";
import { brandCategoryColours, defaultSignOff } from "@/src/lib/seed-data";
import { bandCoverageIssues } from "@/src/lib/scoring";
import type { Assessment, AssessmentDraft, InsightLevel, Question, ResultBand, ScoreCategory } from "@/src/lib/types";

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const insightLevels: { level: InsightLevel; label: string }[] = [
  { level: "low", label: "Low score (0–33%)" },
  { level: "medium", label: "Medium score (34–66%)" },
  { level: "high", label: "High score (67–100%)" },
];

function makeBand(minScore: number, maxScore: number, label: string, title: string, needsSupport = false): ResultBand {
  return { id: makeId("band"), minScore, maxScore, label, title, summary: "Your answers suggest there is a useful pattern to notice.", body: "Use this space to explain the result in a warm, useful way.", ctaLabel: "Learn more", ctaHref: "https://absolutemind.co.uk/", videoTitle: "A calmer way forward", videoDescription: "Add the supporting result content here.", videoUrl: "", needsSupport, pdf: { heading: "PERSONALISED REPORT", introduction: "A thoughtful snapshot of the patterns behind your answers.", nextStep: "Add the next-step copy for this result.", note: "Add the closing note for this result." } };
}

function starterDraft(initial?: Assessment): AssessmentDraft {
  if (initial) return { id: initial.id, name: initial.name, shortName: initial.shortName, slug: initial.slug, tagline: initial.tagline, description: initial.description, completionMinutes: initial.completionMinutes, status: initial.status, signOff: initial.signOff ?? defaultSignOff, categories: initial.categories, questions: initial.questions, resultBands: initial.resultBands };
  const category: ScoreCategory = { id: makeId("category"), name: "Overall wellbeing", description: "The overall pattern in your answers.", color: brandCategoryColours[0], insights: { low: "", medium: "", high: "" } };
  const question: Question = { id: makeId("question"), prompt: "How are things feeling for you at the moment?", helpText: "Choose the response that feels closest to your experience.", type: "SINGLE_CHOICE", categoryId: category.id, options: [{ id: makeId("option"), label: "Almost never", score: 0 }, { id: makeId("option"), label: "Occasionally", score: 1 }, { id: makeId("option"), label: "Often", score: 2 }, { id: makeId("option"), label: "Almost always", score: 3 }] };
  return { name: "Your new assessment", shortName: "New check-in", slug: "your-assessment", tagline: "A clear, thoughtful check-in.", description: "Tell people what this check-in will help them understand.", completionMinutes: 3, status: "DRAFT", signOff: defaultSignOff, categories: [category], questions: [question], resultBands: [makeBand(0, 24, "A steadier starting point", "You have a useful foundation of calm"), makeBand(25, 49, "A mind asking for space", "You may be carrying more than it looks"), makeBand(50, 74, "A pattern worth changing", "This may be affecting your everyday life"), makeBand(75, 100, "A clear invitation to support", "It may be time to stop facing this alone", true)] };
}

export function NewAssessmentForm({ initial }: { initial?: Assessment }) {
  const [draft, setDraft] = useState<AssessmentDraft>(() => starterDraft(initial));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedSlug, setSavedSlug] = useState(initial?.slug ?? "");
  const bandIssues = bandCoverageIssues(draft.resultBands);
  const update = <K extends keyof AssessmentDraft>(key: K, value: AssessmentDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const updateQuestion = (id: string, patch: Partial<Question>) => setDraft((current) => ({ ...current, questions: current.questions.map((question) => question.id === id ? { ...question, ...patch } : question) }));
  const updateOption = (question: Question, optionId: string, patch: Partial<Question["options"][number]>) => updateQuestion(question.id, { options: question.options.map((candidate) => candidate.id === optionId ? { ...candidate, ...patch } : candidate) });
  const updateBand = (id: string, patch: Partial<ResultBand>) => setDraft((current) => ({ ...current, resultBands: current.resultBands.map((band) => band.id === id ? { ...band, ...patch } : band) }));
  const updateCategory = (id: string, patch: Partial<ScoreCategory>) => setDraft((current) => ({ ...current, categories: current.categories.map((category) => category.id === id ? { ...category, ...patch } : category) }));
  const updateInsight = (category: ScoreCategory, level: InsightLevel, value: string) => updateCategory(category.id, { insights: { low: "", medium: "", high: "", ...category.insights, [level]: value } });
  const save = async (status: "DRAFT" | "LIVE") => {
    setBusy(true); setError(""); setMessage("");
    const payload = { ...draft, status };
    if (!payload.name.trim() || !payload.slug.trim()) { setError("Add a name and public URL first."); setBusy(false); return; }
    try {
      const response = await fetch("/api/admin/assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "We could not save this assessment.");
      setDraft((current) => ({ ...current, id: body.id, status })); setSavedSlug(body.slug); setMessage(status === "LIVE" ? "Published and ready to share." : "Draft saved."); window.history.replaceState(null, "", `/admin/assessments/${body.id}`);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "We could not save this assessment."); } finally { setBusy(false); }
  };
  const addQuestion = () => setDraft((current) => ({ ...current, questions: [...current.questions, { id: makeId("question"), prompt: "", helpText: "", type: "SINGLE_CHOICE", categoryId: current.categories[0]?.id, options: [{ id: makeId("option"), label: "", score: 0 }, { id: makeId("option"), label: "", score: 1 }] }] }));
  const removeQuestion = (id: string) => setDraft((current) => ({ ...current, questions: current.questions.filter((question) => question.id !== id) }));
  const moveQuestion = (id: string, targetIndex: number) => setDraft((current) => { const currentIndex = current.questions.findIndex((question) => question.id === id); if (currentIndex < 0 || currentIndex === targetIndex) return current; const questions = [...current.questions]; const [question] = questions.splice(currentIndex, 1); questions.splice(targetIndex, 0, question); return { ...current, questions }; });
  const addCategory = () => setDraft((current) => ({ ...current, categories: [...current.categories, { id: makeId("category"), name: "New category", description: "", color: brandCategoryColours[current.categories.length % brandCategoryColours.length], insights: { low: "", medium: "", high: "" } }] }));
  const removeCategory = (id: string) => setDraft((current) => ({ ...current, categories: current.categories.filter((category) => category.id !== id), questions: current.questions.map((question) => question.categoryId === id ? { ...question, categoryId: undefined } : question) }));
  const addBand = () => setDraft((current) => ({ ...current, resultBands: [...current.resultBands, makeBand(0, 100, "New result", "Your result")] }));
  const removeBand = (id: string) => setDraft((current) => ({ ...current, resultBands: current.resultBands.filter((band) => band.id !== id) }));
  const signOff = draft.signOff ?? defaultSignOff;

  return <div className="admin-shell"><AdminSidebar active="Assessments" /><main className="admin-main"><div className="page-title"><div><div className="eyebrow">Assessment studio</div><h1>{initial ? "Edit assessment" : "Create an assessment"}</h1><p>Build the questions, scoring and result experience Paula wants to share.</p></div><Link className="button button-ghost" href="/admin/assessments">← Back to assessments</Link></div>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message} {savedSlug && draft.status === "LIVE" && <a href={`/assessments/${savedSlug}`} target="_blank" rel="noreferrer">Open public link ↗</a>}</p>}<div className="builder-stack">

    <section className="form-card"><h2>1. Basics</h2><p>These are the details people see before they begin.</p>
      <div className="builder-grid"><div className="field"><label htmlFor="name">Assessment name</label><input id="name" value={draft.name} onChange={(event) => update("name", event.target.value)} /><small className="field-hint">The last two words are highlighted in orange.</small></div><div className="field"><label htmlFor="shortName">Short name</label><input id="shortName" value={draft.shortName} onChange={(event) => update("shortName", event.target.value)} /></div><div className="field"><label htmlFor="slug">Public URL ending</label><input id="slug" value={draft.slug} onChange={(event) => update("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))} /><small className="field-hint">/assessments/{draft.slug}</small></div><div className="field"><label htmlFor="minutes">Estimated minutes</label><input id="minutes" type="number" min="1" max="60" value={draft.completionMinutes} onChange={(event) => update("completionMinutes", Number(event.target.value))} /></div></div>
      <div className="field"><label htmlFor="tagline">Short tagline</label><input id="tagline" value={draft.tagline} onChange={(event) => update("tagline", event.target.value)} /></div>
      <div className="field"><label htmlFor="description">Introduction</label><textarea id="description" value={draft.description} onChange={(event) => update("description", event.target.value)} /></div>
      <div className="builder-subheading">Personal sign-off</div>
      <div className="builder-grid"><div className="field"><label htmlFor="signOffName">Signed by</label><input id="signOffName" value={signOff.name} onChange={(event) => update("signOff", { ...signOff, name: event.target.value })} /></div><div className="field"><label htmlFor="signOffMessage">Closing message</label><textarea id="signOffMessage" value={signOff.message} onChange={(event) => update("signOff", { ...signOff, message: event.target.value })} /><small className="field-hint">Shown at the end of every result page, email and PDF.</small></div></div>
    </section>

    <section className="form-card"><div className="builder-heading"><div><h2>2. Categories</h2><p>Areas shown in the result breakdown. The highest-scoring area becomes the person's main focus, and the lowest becomes their strongest area. Write what each score level means for them.</p></div><button className="button button-ghost" type="button" onClick={addCategory}>+ Add category</button></div>
      {draft.categories.map((category) => <div className="builder-item" key={category.id}>
        <div className="question-builder-heading"><div className="eyebrow">{category.name || "Category"}</div><button className="button button-ghost button-danger" type="button" onClick={() => removeCategory(category.id)}>Delete category</button></div>
        <div className="builder-grid"><div className="field"><label>Category name</label><input value={category.name} onChange={(event) => updateCategory(category.id, { name: event.target.value })} /></div><div className="field"><label>Colour</label><div className="colour-picker"><input type="color" aria-label="Category colour" value={/^#[0-9a-f]{6}$/i.test(category.color) ? category.color : brandCategoryColours[0]} onChange={(event) => updateCategory(category.id, { color: event.target.value })} />{brandCategoryColours.map((colour) => <button key={colour} type="button" className={`swatch ${category.color === colour ? "selected" : ""}`} style={{ background: colour }} aria-label={`Use ${colour}`} onClick={() => updateCategory(category.id, { color: colour })} />)}</div></div></div>
        <div className="field"><label>Description</label><input value={category.description} onChange={(event) => updateCategory(category.id, { description: event.target.value })} /></div>
        <div className="builder-grid three">{insightLevels.map(({ level, label }) => <div className="field" key={level}><label>{label}</label><textarea value={category.insights?.[level] ?? ""} placeholder="What this means for them…" onChange={(event) => updateInsight(category, level, event.target.value)} /></div>)}</div>
      </div>)}
    </section>

    <section className="form-card"><div className="builder-heading"><div><h2>3. Questions and scoring</h2><p>Use single choice, rating scale or written answers. Add an optional reflection to any answer and it will be quoted back in the person's report (up to three, highest-scoring first).</p></div><button className="button button-ghost" type="button" onClick={addQuestion}>+ Add question</button></div>
      {draft.questions.map((question, questionIndex) => <div className="builder-item" key={question.id}>
        <div className="question-builder-heading"><div className="eyebrow">Question {questionIndex + 1}</div><div className="question-builder-actions"><label className="question-position">Position<select aria-label={`Position for question ${questionIndex + 1}`} value={questionIndex + 1} onChange={(event) => moveQuestion(question.id, Number(event.target.value) - 1)}>{draft.questions.map((_, position) => <option key={position} value={position + 1}>Question {position + 1}</option>)}</select></label><button className="button button-ghost button-danger" type="button" onClick={() => removeQuestion(question.id)}>Delete question</button></div></div>
        <div className="builder-grid"><div className="field"><label>Question</label><input value={question.prompt} onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })} /></div><div className="field"><label>Question type</label><select value={question.type ?? "SINGLE_CHOICE"} onChange={(event) => updateQuestion(question.id, { type: event.target.value as Question["type"] })}><option value="SINGLE_CHOICE">Single choice</option><option value="SCALE">Rating scale</option><option value="TEXT">Written answer</option></select></div></div>
        <div className="builder-grid"><div className="field"><label>Help text</label><input value={question.helpText ?? ""} onChange={(event) => updateQuestion(question.id, { helpText: event.target.value })} /></div><div className="field"><label>Category</label><select value={question.categoryId ?? ""} onChange={(event) => updateQuestion(question.id, { categoryId: event.target.value || undefined })}><option value="">No category</option>{draft.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div></div>
        {question.type === "TEXT" ? <label className="consent-row"><input type="checkbox" checked={Boolean(question.optional)} onChange={(event) => updateQuestion(question.id, { optional: event.target.checked })} /><span>Optional written answer (people can skip it). Written answers are not scored but appear in the report under "In your words".</span></label>
          : <div className="option-editor">{question.options.map((option) => <div className="option-editor-block" key={option.id}><div className="option-editor-row"><input value={option.label} placeholder="Answer label" onChange={(event) => updateOption(question, option.id, { label: event.target.value })} /><input type="number" value={option.score} aria-label="Score" onChange={(event) => updateOption(question, option.id, { score: Number(event.target.value) })} /><button className="button button-ghost" type="button" onClick={() => updateQuestion(question.id, { options: question.options.filter((candidate) => candidate.id !== option.id) })}>Remove</button></div><input className="option-insight" value={option.insight ?? ""} placeholder="Optional reflection shown when someone chooses this answer" onChange={(event) => updateOption(question, option.id, { insight: event.target.value })} /></div>)}<button className="button button-ghost" type="button" onClick={() => updateQuestion(question.id, { options: [...question.options, { id: makeId("option"), label: "", score: question.options.length }] })}>+ Add answer</button></div>}
      </div>)}
    </section>

    <section className="form-card"><div className="builder-heading"><div><h2>4. Results and PDF content</h2><p>Each score band gets its own result page copy and PDF content. Bands should cover every score from 0 to 100 without gaps.</p></div><button className="button button-ghost" type="button" onClick={addBand}>+ Add result band</button></div>
      {bandIssues.length > 0 && <div className="admin-notice" role="status"><strong>Check your score bands:</strong> {bandIssues.join(" ")}</div>}
      {draft.resultBands.map((band, bandIndex) => <div className="builder-item" key={band.id}>
        <div className="question-builder-heading"><div className="eyebrow">Result band {bandIndex + 1}</div><button className="button button-ghost button-danger" type="button" onClick={() => removeBand(band.id)}>Delete band</button></div>
        <div className="builder-grid"><div className="field"><label>Minimum score</label><input type="number" value={band.minScore} onChange={(event) => updateBand(band.id, { minScore: Number(event.target.value) })} /></div><div className="field"><label>Maximum score</label><input type="number" value={band.maxScore} onChange={(event) => updateBand(band.id, { maxScore: Number(event.target.value) })} /></div><div className="field"><label>Band label</label><input value={band.label} onChange={(event) => updateBand(band.id, { label: event.target.value })} /></div><div className="field"><label>Result title</label><input value={band.title} onChange={(event) => updateBand(band.id, { title: event.target.value })} /></div></div>
        <label className="consent-row"><input type="checkbox" checked={Boolean(band.needsSupport)} onChange={(event) => updateBand(band.id, { needsSupport: event.target.checked })} /><span>Mark as a priority result: crisis support details are shown near the top, and the result is flagged for you in Reports.</span></label>
        <div className="field"><label>Summary shown at the top of the result</label><textarea value={band.summary} onChange={(event) => updateBand(band.id, { summary: event.target.value })} /></div>
        <div className="field"><label>Result page detail</label><textarea value={band.body} onChange={(event) => updateBand(band.id, { body: event.target.value })} /></div>
        <div className="builder-grid"><div className="field"><label>Button label</label><input value={band.ctaLabel} onChange={(event) => updateBand(band.id, { ctaLabel: event.target.value })} /></div><div className="field"><label>Button link</label><input value={band.ctaHref} onChange={(event) => updateBand(band.id, { ctaHref: event.target.value })} /></div></div>
        <div className="builder-subheading">Next step and video</div>
        <div className="builder-grid"><div className="field"><label>Next step heading</label><input value={band.videoTitle} onChange={(event) => updateBand(band.id, { videoTitle: event.target.value })} /></div><div className="field"><label>Video link</label><input value={band.videoUrl ?? ""} placeholder="YouTube or Vimeo link" onChange={(event) => updateBand(band.id, { videoUrl: event.target.value })} /><small className="field-hint">Leave empty to hide the video.</small></div></div>
        <div className="field"><label>Next step text</label><textarea value={band.videoDescription} onChange={(event) => updateBand(band.id, { videoDescription: event.target.value })} /></div>
        <div className="builder-subheading">PDF content for this score band</div>
        <div className="builder-grid"><div className="field"><label>PDF heading</label><input value={band.pdf?.heading ?? ""} onChange={(event) => updateBand(band.id, { pdf: { ...band.pdf, heading: event.target.value } })} /></div><div className="field"><label>PDF introduction</label><textarea value={band.pdf?.introduction ?? ""} onChange={(event) => updateBand(band.id, { pdf: { ...band.pdf, introduction: event.target.value } })} /></div><div className="field"><label>PDF next step</label><textarea value={band.pdf?.nextStep ?? ""} onChange={(event) => updateBand(band.id, { pdf: { ...band.pdf, nextStep: event.target.value } })} /></div><div className="field"><label>PDF closing note</label><textarea value={band.pdf?.note ?? ""} onChange={(event) => updateBand(band.id, { pdf: { ...band.pdf, note: event.target.value } })} /></div></div>
      </div>)}
    </section>
  </div><div className="builder-actions"><button className="button button-ghost" type="button" disabled={busy} onClick={() => save("DRAFT")}>Save draft</button><button className="button button-primary" type="button" disabled={busy || bandIssues.length > 0} title={bandIssues.length ? "Fix the score bands before publishing" : undefined} onClick={() => save("LIVE")}>{busy ? "Saving…" : "Publish check-in →"}</button></div></main></div>;
}
