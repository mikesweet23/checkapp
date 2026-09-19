import { notFound } from "next/navigation";
import { AssessmentRunner } from "@/src/components/assessment-runner";
import { getAssessmentForPublic } from "@/src/lib/assessment-repository";

export default async function AssessmentRunPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const assessment = await getAssessmentForPublic(slug);
  if (!assessment || assessment.status !== "LIVE") notFound();
  return <AssessmentRunner assessment={assessment} />;
}
