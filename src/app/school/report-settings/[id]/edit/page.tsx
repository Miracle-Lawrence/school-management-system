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
          Configure the information that should appear on this report.
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

        <div className="space-y-4 rounded-lg border border-slate-200 p-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Report Card Display
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Choose which approval and report information should appear on
              generated report cards.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="showClassPosition"
              defaultChecked={configuration.showClassPosition}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />

            <span>
              <span className="block text-sm font-medium text-slate-900">
                Show Class Position
              </span>

              <span className="mt-1 block text-sm leading-5 text-slate-500">
                Display the student's position in the class summary.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="showClassTeacherName"
              defaultChecked={configuration.showClassTeacherName}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />

            <span>
              <span className="block text-sm font-medium text-slate-900">
                Show Class Teacher Name
              </span>

              <span className="mt-1 block text-sm leading-5 text-slate-500">
                Display the assigned class teacher's name in the signature
                section.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="showPrincipalSignature"
              defaultChecked={configuration.showPrincipalSignature}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />

            <span>
              <span className="block text-sm font-medium text-slate-900">
                Show Principal Signature
              </span>

              <span className="mt-1 block text-sm leading-5 text-slate-500">
                Include the principal's signature area on the report card.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="showSchoolStamp"
              defaultChecked={configuration.showSchoolStamp}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />

            <span>
              <span className="block text-sm font-medium text-slate-900">
                Show School Stamp
              </span>

              <span className="mt-1 block text-sm leading-5 text-slate-500">
                Include the official school stamp in the signature section.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="showAttendance"
              defaultChecked={configuration.showAttendance}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />

            <span>
              <span className="block text-sm font-medium text-slate-900">
                Show Attendance
              </span>

              <span className="mt-1 block text-sm leading-5 text-slate-500">
                Display the student's attendance summary for the selected term.
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
