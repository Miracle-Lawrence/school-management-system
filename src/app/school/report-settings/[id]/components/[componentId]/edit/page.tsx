import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { getReportComponent } from "@/lib/services/report-configuration.service";
import EditReportComponentForm from "./edit-form";
import CalculatedEditForm from "./calculated-edit-form";

interface PageProps {
  params: Promise<{
    id: string;
    componentId: string;
  }>;
}

export default async function EditReportComponentPage({ params }: PageProps) {
  const { id, componentId } = await params;

  const configurationId = Number(id);
  const parsedComponentId = Number(componentId);

  if (
    !Number.isInteger(configurationId) ||
    configurationId < 1 ||
    !Number.isInteger(parsedComponentId) ||
    parsedComponentId < 1
  ) {
    notFound();
  }

  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const component = await getReportComponent(schoolId, parsedComponentId);

  if (component.configurationId !== configurationId) {
    notFound();
  }

  if (component.type === "CALCULATED") {
    return (
      <CalculatedEditForm
        configurationId={configurationId}
        component={{
          id: component.id,
          name: component.name,
          displayOrder: component.displayOrder,
          isRequired: component.isRequired,
          isVisible: component.isVisible,
        }}
      />
    );
  }

  if (component.type !== "ASSESSMENT") {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Edit Assessment Component
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Update the settings for {component.name}.
        </p>
      </div>

      <EditReportComponentForm
        configurationId={configurationId}
        component={{
          id: component.id,
          name: component.name,
          assessmentType: component.assessmentType,
          maxScore: component.maxScore,
          displayOrder: component.displayOrder,
          isRequired: component.isRequired,
          isVisible: component.isVisible,
        }}
      />
    </main>
  );
}
