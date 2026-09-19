import { notFound } from "next/navigation";
import { NewAssessmentForm } from "@/src/components/new-assessment-form";
import { getAdminAssessment } from "@/src/lib/assessment-repository";
import { requireAdmin } from "@/src/lib/admin-auth";

export default async function EditAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const assessment = await getAdminAssessment(id);
  if (!assessment) notFound();
  return <NewAssessmentForm initial={assessment} />;
}
