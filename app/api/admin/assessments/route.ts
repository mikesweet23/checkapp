import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/admin-auth";
import { saveAssessmentDraft } from "@/src/lib/assessment-repository";
import type { AssessmentDraft } from "@/src/lib/types";

export const runtime = "nodejs";

function validDraft(value: unknown): value is AssessmentDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<AssessmentDraft>;
  return typeof draft.name === "string" && draft.name.trim().length > 0
    && typeof draft.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)
    && typeof draft.shortName === "string"
    && typeof draft.tagline === "string"
    && typeof draft.description === "string"
    && (draft.status === "DRAFT" || draft.status === "LIVE" || draft.status === "ARCHIVED")
    && Array.isArray(draft.categories)
    && Array.isArray(draft.questions)
    && Array.isArray(draft.resultBands);
}

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json().catch(() => null);
  if (!validDraft(body)) return NextResponse.json({ error: "Please complete the assessment basics before saving." }, { status: 400 });
  if (body.status === "LIVE" && (!body.questions.length || !body.resultBands.length)) {
    return NextResponse.json({ error: "Add at least one question and one result band before publishing." }, { status: 400 });
  }
  try {
    const assessment = await saveAssessmentDraft({ ...body, completionMinutes: Number(body.completionMinutes) || 3 });
    return NextResponse.json({ ok: true, id: assessment.id, slug: assessment.slug });
  } catch (error) {
    console.error("Could not save assessment", error);
    return NextResponse.json({ error: "We could not save this assessment. Check that the URL is unique and try again." }, { status: 400 });
  }
}
