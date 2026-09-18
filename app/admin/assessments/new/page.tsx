import { NewAssessmentForm } from "@/src/components/new-assessment-form";
import { requireAdmin } from "@/src/lib/admin-auth";

export default async function NewAssessmentPage() {
  await requireAdmin();
  return <NewAssessmentForm />;
}
