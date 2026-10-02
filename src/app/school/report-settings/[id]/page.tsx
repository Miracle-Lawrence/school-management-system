import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";

import {
  getReportConfigurations,
  getReportComponents,
  getReportComponentRules,
} from "@/lib/services/report-configuration.service";

interface ReportConfigurationDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReportConfigurationDetailsPage({
  params,
}: ReportConfigurationDetailsPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const configurationId = Number(id);

  if (!Number.isInteger(configurationId) || configurationId < 1) {
    notFound();
  }

  const configurations = await getReportConfigurations(schoolId);

  const configuration = configurations.find(
    (item) => item.id === configurationId,
  );

  if (!configuration) {
    notFound();
  }

    const components = await getReportComponents(schoolId, configurationId);
    const calculatedComponents = components.filter(
      (component) => component.type === "CALCULATED",
    );

    const ruleSummaries = await Promise.all(
      calculatedComponents.map(async (component) => {
        const rules = await getReportComponentRules(schoolId, component.id);

        const totalWeight = rules.reduce(
          (total, rule) => total + (rule.weight ?? 0),
          0,
        );

        return {
          componentId: component.id,
          rules,
          totalWeight,
          isComplete: rules.length > 0 && Math.abs(totalWeight - 100) < 0.0001,
        };
      }),
    );

    const ruleSummaryMap = new Map(
      ruleSummaries.map((summary) => [summary.componentId, summary]),
    );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/school/report-settings"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Report Settings
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Results Management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {configuration.name}
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              {configuration.reportType === "MID_TERM"
                ? "Mid-Term Report Configuration"
                : "Terminal Report Configuration"}
            </p>
          </div>

          <Link
            href={`/school/report-settings/${configuration.id}/edit`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Edit Configuration
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Report Type</p>

          <p className="mt-2 text-lg font-semibold text-slate-900">
            {configuration.reportType === "MID_TERM" ? "Mid-Term" : "Terminal"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Configuration Status</p>

          <p
            className={`mt-2 text-lg font-semibold ${
              configuration.isActive ? "text-green-700" : "text-slate-500"
            }`}
          >
            {configuration.isActive ? "Active" : "Inactive"}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Report Components
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Define the assessment and calculated components of this report.
            </p>
          </div>

          <Link
            href={`/school/report-settings/${configuration.id}/components/new`}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Add Component
          </Link>
        </div>

        {components.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-xl font-bold">C</span>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No components added yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Add assessment components such as assignments, tests, and
              examinations, or create calculated components for totals.
            </p>

            <Link
              href={`/school/report-settings/${configuration.id}/components/new`}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Add First Component
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Order
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Component
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Type
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Maximum Score
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Calculation Setup
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Visibility
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {components.map((component) => (
                  <tr key={component.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-slate-600">
                      {component.displayOrder}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-900">
                      {component.name}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {component.type === "ASSESSMENT"
                        ? "Assessment"
                        : "Calculated"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {component.maxScore ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      {component.type === "ASSESSMENT" ? (
                        <span className="text-slate-400">Not applicable</span>
                      ) : (
                        (() => {
                          const summary = ruleSummaryMap.get(component.id);

                          if (!summary || summary.rules.length === 0) {
                            return (
                              <div className="space-y-1">
                                <p className="text-sm text-amber-700">
                                  No calculation rules
                                </p>
                                <p className="text-xs text-slate-500">
                                  Total: 0%
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="min-w-48 space-y-2">
                              <div className="space-y-1">
                                {summary.rules.map((rule) => {
                                  const source = components.find(
                                    (item) =>
                                      item.id === rule.sourceComponentId,
                                  );

                                  return (
                                    <div
                                      key={rule.id}
                                      className="flex items-center justify-between gap-4 text-sm"
                                    >
                                      <span className="text-slate-600">
                                        {source?.name ??
                                          `Component #${rule.sourceComponentId}`}
                                      </span>

                                      <span className="font-medium text-slate-800">
                                        {(rule.weight ?? 0).toFixed(2)}%
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="border-t border-slate-200 pt-2">
                                <p className="text-sm font-semibold text-slate-800">
                                  Total: {summary.totalWeight.toFixed(2)}%
                                </p>

                                <p
                                  className={`mt-1 text-xs font-medium ${
                                    summary.isComplete
                                      ? "text-green-700"
                                      : "text-amber-700"
                                  }`}
                                >
                                  {summary.isComplete
                                    ? "Calculation configured"
                                    : "Weight must total 100%"}
                                </p>
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {component.isVisible ? (
                        <span className="text-green-700">Visible</span>
                      ) : (
                        <span className="text-slate-500">Hidden</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {component.type === "ASSESSMENT" ? (
                        <div className="flex items-center gap-4">
                          <Link
                            href={`/school/report-settings/${configuration.id}/components/${component.id}/edit`}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Edit
                          </Link>

                          <Link
                            href={`/school/report-settings/${configuration.id}/components/${component.id}/delete`}
                            className="font-medium text-red-600 hover:text-red-800 hover:underline"
                          >
                            Delete
                          </Link>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <Link
                            href={`/school/report-settings/${configuration.id}/components/${component.id}/rules`}
                            className="font-medium text-purple-600 hover:text-purple-800 hover:underline"
                          >
                            Manage Rules
                          </Link>

                          <Link
                            href={`/school/report-settings/${configuration.id}/components/${component.id}/edit`}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Edit
                          </Link>

                          <Link
                            href={`/school/report-settings/${configuration.id}/components/${component.id}/delete`}
                            className="font-medium text-red-600 hover:text-red-800 hover:underline"
                          >
                            Delete
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
