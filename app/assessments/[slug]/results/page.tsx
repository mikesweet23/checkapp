import { notFound } from "next/navigation";
import { ResultsPage } from "@/src/components/results-page";
import { getAssessmentForPublic } from "@/src/lib/assessment-repository";

export default async function AssessmentResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const assessment = await getAssessmentForPublic(slug);
  if (!assessment || assessment.status !== "LIVE" || !assessment.questions.length) notFound();
  return <ResultsPage assessment={assessment} />;
}
