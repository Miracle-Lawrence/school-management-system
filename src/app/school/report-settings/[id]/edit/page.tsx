import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { getReportConfigurations } from "@/lib/services/report-configuration.service";

import { updateReportConfigurationAction } from "./actions";

interface EditReportConfigurationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditReportConfigurationPage({
  params,
}: EditReportConfigurationPageProps) {
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

  const updateAction = updateReportConfigurationAction.bind(
    null,
    configuration.id,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/school/report-settings"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Report Settings
        </Link>

        <p className="mt-5 text-sm font-semibold text-blue-600">
          Results Management
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Edit Report Configuration
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Update the name or activation status of this report configuration.
        </p>
      </div>

      <form
        action={updateAction}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Configuration Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={configuration.name}
            maxLength={100}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Report Type
          </label>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            {configuration.reportType === "MID_TERM"
              ? "Mid-Term Report"
              : "Terminal Report"}
          </div>

          <p className="mt-2 text-xs text-slate-500">
            The report type cannot be changed after configuration creation.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={configuration.isActive}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />

            <span>
              <span className="block text-sm font-medium text-slate-900">
                Active Configuration
              </span>

              <span className="mt-1 block text-sm leading-5 text-slate-500">
                Enable this configuration for use in your school's result
                management process.
              </span>
            </span>
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/school/report-settings"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
