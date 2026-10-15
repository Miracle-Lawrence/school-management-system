import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { getActiveAssessmentCategories } from "@/lib/services/report-configuration.service";
import NewReportComponentForm from "./component-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewReportComponentPage({ params }: PageProps) {
  const { id } = await params;
  const configurationId = Number(id);

  if (!Number.isInteger(configurationId) || configurationId < 1) {
    notFound();
  }

  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const categories = await getActiveAssessmentCategories(schoolId);

  return (
    <NewReportComponentForm
      configurationId={configurationId}
      categories={categories}
    />
  );
}
