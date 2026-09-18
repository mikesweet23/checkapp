import { notFound } from "next/navigation";
import { AssessmentRunner } from "@/src/components/assessment-runner";
import { getAssessment } from "@/src/lib/seed-data";

export default async function AssessmentRunPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const assessment = getAssessment(slug);
  if (!assessment || assessment.status !== "LIVE") notFound();
  return <AssessmentRunner assessment={assessment} />;
}
