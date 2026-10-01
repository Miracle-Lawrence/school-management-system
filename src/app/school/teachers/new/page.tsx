import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { createTeacher } from "@/lib/services/teacher.service";
import { createTeacherSchema } from "@/lib/validation/teacher";

export default function NewTeacherPage() {
  async function createTeacherAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const result = createTeacherSchema.safeParse({
      employeeId: formData.get("employeeId"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      phone: formData.get("phone"),
      email: formData.get("email"),
    });

    if (!result.success) {
      throw new Error(
        result.error.issues[0]?.message ?? "Invalid teacher information.",
      );
    }

    await createTeacher(schoolId, result.data);

    redirect("/school/teachers");
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-2 sm:px-4">
      {/* Header */}
      <div>
        <Link
          href="/school/teachers"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Teachers
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Staff Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Add Teacher
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add a teacher to your school's staff records.
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        action={createTeacherAction}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Basic information */}
        <section className="border-b border-slate-200 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900">
              Basic Information
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Enter the teacher's identification and name.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="employeeId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Employee ID <span className="text-red-500">*</span>
              </label>

              <input
                id="employeeId"
                name="employeeId"
                type="text"
                required
                placeholder="e.g. TCH-001"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  First Name <span className="text-red-500">*</span>
                </label>

                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>

                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Contact information */}
        <section className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900">
              Contact Information
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Add the teacher's contact details.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="teacher@example.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Phone
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="08012345678"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <Link
            href="/school/teachers"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Create Teacher
          </button>
        </div>
      </form>
    </div>
  );
}
