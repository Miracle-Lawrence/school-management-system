import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import {
  getGradeScales,
  validateGradeScaleCoverage,
} from "@/lib/services/grade-scale.service";

export default async function GradingSettingsPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const gradeScales = await getGradeScales(schoolId);

  let coverageValid = true;
  let coverageMessage = "Grade scale covers 0–100.";

  try {
    await validateGradeScaleCoverage(schoolId);
  } catch (error) {
    coverageValid = false;
    coverageMessage =
      error instanceof Error
        ? error.message
        : "Grade scale coverage is incomplete.";
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-2 sm:px-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/school/settings"
            className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
          >
            ← Back to School Settings
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Grading Scale
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Configure the grades and score ranges used when calculating student
            results.
          </p>
        </div>

        <Link
          href="/school/settings/grading/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + Add Grade
        </Link>
      </div>

      <div
        className={`rounded-lg border p-4 ${
          coverageValid
            ? "border-green-200 bg-green-50"
            : "border-yellow-200 bg-yellow-50"
        }`}
      >
        <p
          className={`text-sm font-medium ${
            coverageValid ? "text-green-800" : "text-yellow-800"
          }`}
        >
          {coverageMessage}
        </p>

        {!coverageValid && (
          <p className="mt-1 text-sm text-yellow-700">
            Make sure your active grade ranges start at 0, extend to 100, and do
            not contain gaps.
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-4">
          <h2 className="font-semibold text-gray-900">Grade Scales</h2>
        </div>

        {gradeScales.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="font-medium text-gray-900">
              No grade scales configured.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Add your school's grading scale to begin calculating grades.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Grade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Range
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Remark
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {gradeScales.map((gradeScale) => (
                  <tr key={gradeScale.id}>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                      {gradeScale.displayOrder}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="font-bold text-gray-900">
                        {gradeScale.code}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                      {gradeScale.minScore}–{gradeScale.maxScore}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700">
                      {gradeScale.remark || "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          gradeScale.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {gradeScale.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <Link
                        href={`/school/settings/grading/${gradeScale.id}/edit`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Edit
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
