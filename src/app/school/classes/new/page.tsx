import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { createClass } from "@/lib/services/class.service";
import { createClassSchema } from "@/lib/validation/class";

export default function NewClassPage() {
  async function createClassAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const result = createClassSchema.safeParse({
      name: formData.get("name"),
      level: formData.get("level"),
      description: formData.get("description"),
    });

    if (!result.success) {
      throw new Error(
        result.error.issues[0]?.message ?? "Invalid class information.",
      );
    }

    await createClass(schoolId, result.data);

    redirect("/school/classes");
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-2 sm:px-4">
      {/* Page heading */}
      <div>
        <Link
          href="/school/classes"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Classes
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Academic Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Add Class
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create a class for your school and provide its basic academic
            information.
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        action={createClassAction}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <section className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900">
              Class Information
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Enter the class name, level, and an optional description.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Class Name <span className="text-red-500">*</span>
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. JSS 1A"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Use a clear class name such as JSS 1A or SS 2 Science.
              </p>
            </div>

            <div>
              <label
                htmlFor="level"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Level
              </label>

              <input
                id="level"
                name="level"
                type="text"
                placeholder="e.g. Junior Secondary"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Optional. You can use this to identify the broader school level.
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
                rows={4}
                placeholder="Optional class description"
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Optional information about this class.
              </p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <Link
            href="/school/classes"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Create Class
          </button>
        </div>
      </form>
    </div>
  );
}
