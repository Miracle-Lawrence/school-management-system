import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { createPsychomotorField } from "@/lib/services/psychomotor.service";
import { psychomotorFieldSchema } from "@/lib/validation/psychomotor";

export default async function NewPsychomotorFieldPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    redirect("/login");
  }

  async function createFieldAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const result = psychomotorFieldSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      displayOrder: formData.get("displayOrder"),
      isActive: formData.get("isActive") === "on",
    });

    if (!result.success) {
      throw new Error(
        result.error.issues[0]?.message || "Invalid psychomotor field.",
      );
    }

    await createPsychomotorField(schoolId, result.data);

    redirect("/school/settings/psychomotor");
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-2 py-6 sm:px-4">
      <div>
        <Link
          href="/school/settings/psychomotor"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Psychomotor & Behaviour
        </Link>

        <p className="mt-5 text-sm font-semibold text-blue-600">
          School Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Add Behaviour Field
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Add a behaviour or psychomotor area that teachers will assess for
          students.
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <h2 className="font-semibold text-slate-900">Field Information</h2>

          <p className="mt-1 text-sm text-slate-600">
            Examples include Punctuality, Neatness, Leadership and
            Attentiveness.
          </p>
        </div>

        <form action={createFieldAction} className="p-6 sm:p-8">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Field Name <span className="text-red-500">*</span>
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Punctuality"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
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
                placeholder="Optional description of what this field measures."
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="displayOrder"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Display Order <span className="text-red-500">*</span>
              </label>

              <input
                id="displayOrder"
                name="displayOrder"
                type="number"
                min="1"
                step="1"
                defaultValue="1"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1.5 text-xs text-slate-500">
                Determines the order in which this field appears on the report
                card.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Active
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Active fields are available for teacher assessment and
                    appear on report cards.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/school/settings/psychomotor"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Create Field
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
