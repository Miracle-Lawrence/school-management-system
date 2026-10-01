import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { createAcademicSession } from "@/lib/services/academic-session.service";
import { createAcademicSessionSchema } from "@/lib/validation/academic-session";

export default function NewAcademicSessionPage() {
  async function createAcademicSessionAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const result = createAcademicSessionSchema.safeParse({
      name: formData.get("name"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    });

    if (!result.success) {
      throw new Error(
        result.error.issues[0]?.message ??
          "Invalid academic session information.",
      );
    }

    await createAcademicSession(schoolId, result.data);

    redirect("/school/academic-sessions");
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-2 sm:px-4">
      {/* Header */}
      <div>
        <Link
          href="/school/academic-sessions"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Academic Sessions
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Academic Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Add Academic Session
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create a new academic session for your school.
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        action={createAcademicSessionAction}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <section className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900">
              Session Information
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Enter the academic session name and its start and end dates.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Session Name <span className="text-red-500">*</span>
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. 2026/2027"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Use a clear name such as 2026/2027.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="startDate"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Start Date <span className="text-red-500">*</span>
                </label>

                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  End Date <span className="text-red-500">*</span>
                </label>

                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <Link
            href="/school/academic-sessions"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Create Session
          </button>
        </div>
      </form>
    </div>
  );
}
