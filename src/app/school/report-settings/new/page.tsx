import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { createReportConfigurationAction } from "./actions";
import { getGradeScaleSets } from "@/lib/services/report-configuration.service";

export default async function NewReportConfigurationPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const gradeScaleSets = await getGradeScaleSets(schoolId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Results Management
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Add Report Configuration
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Create a configuration for how your school calculates student results.
        </p>
      </div>

      <div className="mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {" "}
        <form action={createReportConfigurationAction} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-slate-900"
            >
              Configuration Name
            </label>

            <p className="mt-1 text-sm text-slate-500">
              Give this configuration a clear name, such as "Terminal Result
              2026".
            </p>

            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Terminal Result 2026"
              className="mt-3 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="reportType"
              className="block text-sm font-semibold text-slate-900"
            >
              Report Type
            </label>

            <p className="mt-1 text-sm text-slate-500">
              Select whether this configuration is for mid-term or terminal
              results.
            </p>

            <select
              id="reportType"
              name="reportType"
              defaultValue="TERMINAL"
              className="mt-3 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="MID_TERM">Mid-Term</option>
              <option value="TERMINAL">Terminal</option>
            </select>
          </div>

          <div>
            <label htmlFor="gradeScaleSetId">Grading Set</label>
            <select
              id="gradeScaleSetId"
              name="gradeScaleSetId"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Select a grading set
              </option>

              {gradeScaleSets
                .filter((set) => set.isActive)
                .map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                  </option>
                ))}
            </select>
            <p>
              Reports using the same grading set share its grading bands.
              Changes to that set affect every report configuration that uses
              it.
            </p>
          </div>

          <div>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />

              <span>
                <span className="block text-sm font-semibold text-slate-900">
                  Active configuration
                </span>

                <span className="mt-1 block text-sm leading-5 text-slate-500">
                  Allow this configuration to be used when generating results.
                </span>
              </span>
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/school/report-settings"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Create Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
