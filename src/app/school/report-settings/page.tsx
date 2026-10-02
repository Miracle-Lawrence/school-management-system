import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { getReportConfigurations } from "@/lib/services/report-configuration.service";

export default async function ReportSettingsPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const configurations = await getReportConfigurations(schoolId);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Results Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Report Settings
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Configure how your school calculates and presents student results.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/school/report-settings/new"
            className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Add Configuration
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-slate-600">Total report configurations</p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {configurations.length}
        </p>
      </div>

      {/* Configurations */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {configurations.length === 0 ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-xl font-bold">R</span>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No report configurations yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Create a report configuration to define how mid-term and terminal
              results are calculated.
            </p>

            <Link
              href="/school/report-settings/new"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Add Configuration
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Name
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Report Type
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {configurations.map((configuration) => (
                  <tr
                    key={configuration.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/school/report-settings/${configuration.id}`}
                        className="font-semibold text-slate-900 transition hover:text-blue-600"
                      >
                        {configuration.name}
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {configuration.reportType === "MID_TERM"
                        ? "Mid-Term"
                        : "Terminal"}
                    </td>

                    <td className="px-6 py-4">
                      {configuration.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/school/report-settings/${configuration.id}/edit`}
                        className="font-semibold text-blue-600 transition hover:text-blue-700"
                      >
                        Edit Configuration
                      </Link>
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
