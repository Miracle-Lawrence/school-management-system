import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { createSubject } from "@/lib/services/subject.service";
import { createSubjectSchema } from "@/lib/validation/subject";

export default function NewSubjectPage() {
  async function createSubjectAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const result = createSubjectSchema.safeParse({
      name: formData.get("name"),
      code: formData.get("code"),
      description: formData.get("description"),
    });

    if (!result.success) {
      throw new Error(
        result.error.issues[0]?.message ?? "Invalid subject information.",
      );
    }

    await createSubject(schoolId, result.data);

    redirect("/school/subjects");
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-2 sm:px-4">
      {/* Header */}
      <div>
        <Link
          href="/school/subjects"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Subjects
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Academic Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Add Subject
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add a subject offered by your school.
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        action={createSubjectAction}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Subject information */}
        <section className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900">
              Subject Information
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Enter the subject name, code, and description.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Subject Name <span className="text-red-500">*</span>
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Mathematics"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="code"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Subject Code
              </label>

              <input
                id="code"
                name="code"
                type="text"
                placeholder="e.g. MATH"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm uppercase text-slate-900 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                An optional short code used to identify the subject.
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows={5}
                placeholder="Optional subject description"
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Provide a short description of what this subject covers.
              </p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <Link
            href="/school/subjects"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Create Subject
          </button>
        </div>
      </form>
    </div>
  );
}
