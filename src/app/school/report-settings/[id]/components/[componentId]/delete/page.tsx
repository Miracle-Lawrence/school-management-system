import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { getReportComponent } from "@/lib/services/report-configuration.service";

import DeleteComponentForm from "./delete-form";

interface DeleteComponentPageProps {
  params: Promise<{
    id: string;
    componentId: string;
  }>;
}

export default async function DeleteComponentPage({
  params,
}: DeleteComponentPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

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

  const component = await getReportComponent(schoolId, parsedComponentId);

  if (component.configurationId !== configurationId) {
    notFound();
  }

  const isCalculated = component.type === "CALCULATED";

  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <span className="text-xl font-bold">!</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          Delete {isCalculated ? "Calculated" : "Assessment"} Component
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          You are about to delete the component:
        </p>

        <div className="my-4 rounded-lg bg-slate-50 p-4">
          <p className="font-semibold text-slate-900">{component.name}</p>

          {isCalculated ? (
            <p className="mt-1 text-sm text-slate-600">
              Type: Calculated Component
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-600">
              Maximum Score: {component.maxScore ?? "—"}
            </p>
          )}
        </div>

        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm leading-6 text-red-800">
            This action cannot be undone. Components with existing student
            scores or dependencies will be protected from deletion.
          </p>
        </div>

        <DeleteComponentForm
          configurationId={configurationId}
          componentId={parsedComponentId}
          componentName={component.name}
        />

        <div className="mt-5">
          <Link
            href={`/school/report-settings/${configurationId}`}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
          >
            Cancel and return to report configuration
          </Link>
        </div>
      </div>
    </main>
  );
}
