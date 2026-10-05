import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { createGradeScale } from "@/lib/services/grade-scale.service";
import { gradeScaleSchema } from "@/lib/validation/grade-scale";

export default function NewGradeScalePage() {
  async function createGradeScaleAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const result = gradeScaleSchema.safeParse({
      name: formData.get("name"),
      code: formData.get("code"),
      minScore: formData.get("minScore"),
      maxScore: formData.get("maxScore"),
      remark: formData.get("remark"),
      displayOrder: formData.get("displayOrder"),
      isActive: formData.get("isActive") === "on",
    });

    if (!result.success) {
      throw new Error(
        result.error.issues[0]?.message ?? "Invalid grade scale information.",
      );
    }

    if (result.data.minScore >= result.data.maxScore) {
      throw new Error("Minimum score must be less than maximum score.");
    }

    await createGradeScale({
      schoolId,
      name: result.data.name,
      code: result.data.code,
      minScore: result.data.minScore,
      maxScore: result.data.maxScore,
      remark: result.data.remark,
      displayOrder: result.data.displayOrder,
      isActive: result.data.isActive ?? true,
    });

    redirect("/school/settings/grading");
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-2 sm:px-4">
      <div>
        <Link
          href="/school/settings/grading"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Grading Scale
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          Add Grade Scale
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          Add a grade and define the score range and remark used on student
          results.
        </p>
      </div>

      <form
        action={createGradeScaleAction}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Grade Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              placeholder="Excellent"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="code"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Grade Code
            </label>

            <input
              id="code"
              name="code"
              type="text"
              placeholder="A"
              required
              maxLength={20}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="minScore"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Minimum Score
            </label>

            <input
              id="minScore"
              name="minScore"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="80"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="maxScore"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Maximum Score
            </label>

            <input
              id="maxScore"
              name="maxScore"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="100"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="displayOrder"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Display Order
            </label>

            <input
              id="displayOrder"
              name="displayOrder"
              type="number"
              min="1"
              step="1"
              placeholder="1"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="remark"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Remark
            </label>

            <input
              id="remark"
              name="remark"
              type="text"
              placeholder="Excellent"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-gray-700">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked
            className="h-4 w-4 rounded border-gray-300"
          />
          <span>
            <span className="font-medium">Active</span>
            <span className="ml-1 text-gray-500">
              — use this grade when calculating results
            </span>
          </span>
        </label>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/school/settings/grading"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Save Grade
          </button>
        </div>
      </form>
    </div>
  );
}
