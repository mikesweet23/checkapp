import { NewAssessmentForm } from "@/src/components/new-assessment-form";
import { requireAdmin } from "@/src/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function NewAssessmentPage() {
  await requireAdmin();
  return <NewAssessmentForm />;
}
