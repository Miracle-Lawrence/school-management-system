import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { getGradeScaleSets } from "@/lib/services/report-configuration.service";
import {
  getGradeScales,
  validateGradeScaleCoverage,
} from "@/lib/services/grade-scale.service";

interface GradingSettingsPageProps {
  searchParams: Promise<{
    gradeScaleSetId?: string;
  }>;
}

export default async function GradingSettingsPage({
  searchParams,
}: GradingSettingsPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const [{ gradeScaleSetId: selectedId }, gradeScaleSets] = await Promise.all([
    searchParams,
    getGradeScaleSets(schoolId),
  ]);

  const activeSets = gradeScaleSets.filter((set) => set.isActive);

  const requestedId =
    selectedId && /^\d+$/.test(selectedId) ? Number(selectedId) : null;

  const selectedSet =
    activeSets.find((set) => set.id === requestedId) ?? activeSets[0] ?? null;

  if (
    requestedId !== null &&
    !activeSets.some((set) => set.id === requestedId)
  ) {
    notFound();
  }

  const gradeScales = selectedSet
    ? await getGradeScales(schoolId, selectedSet.id)
    : [];

  let coverageValid = false;
  let coverageMessage = "Select a grading set to check its coverage.";

  if (selectedSet) {
    try {
      await validateGradeScaleCoverage(schoolId, selectedSet.id);
      coverageValid = true;
      coverageMessage = "Grading set covers 0–100.";
    } catch (error) {
      coverageMessage =
        error instanceof Error
          ? error.message
          : "Grading set coverage is incomplete.";
    }
  }

  const newGradeHref = selectedSet
    ? `/school/settings/grading/new?gradeScaleSetId=${selectedSet.id}`
    : "/school/settings/grading/new";

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
            Grading Scales
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Manage separate grading bands for mid-term, terminal, or other
            report configurations.
          </p>
        </div>

        <Link
          href={newGradeHref}
          aria-disabled={!selectedSet}
          className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
            selectedSet
              ? "bg-blue-600 hover:bg-blue-700"
              : "pointer-events-none bg-gray-400"
          }`}
        >
          + Add Grade
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <label
          htmlFor="gradeScaleSetId"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Grading Set
        </label>

        {activeSets.length > 0 ? (
          <form method="GET">
            <select
              id="gradeScaleSetId"
              name="gradeScaleSetId"
              defaultValue={String(selectedSet?.id ?? "")}
              onChange={undefined}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 sm:max-w-md"
            >
              {activeSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View Grading Set
            </button>
          </form>
        ) : (
          <div>
            <p className="text-sm text-gray-600">
              No active grading sets are available yet. Create a grading set
              before adding grades.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Grading-set creation is the next part of this setup.
            </p>
          </div>
        )}

        {selectedSet && (
          <p className="mt-3 text-xs text-gray-500">
            Changes to this grading set affect every report configuration that
            uses it.
          </p>
        )}
      </div>

      {selectedSet && (
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
              Make sure the active grade ranges start at 0, extend to 100, and
              do not contain gaps.
            </p>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-4">
          <h2 className="font-semibold text-gray-900">
            {selectedSet ? `${selectedSet.name} — Grades` : "Grade Scales"}
          </h2>
        </div>

        {!selectedSet || gradeScales.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="font-medium text-gray-900">
              {selectedSet
                ? "No grades configured in this grading set."
                : "No grading set selected."}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {selectedSet
                ? "Add grades to define the score ranges and remarks used by this set."
                : "Create a grading set before adding grades."}
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
