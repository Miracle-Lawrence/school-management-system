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
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add Teacher</h1>

        <p className="mt-1 text-sm text-gray-500">
          Add a teacher to your school.
        </p>
      </div>

      <form
        action={createTeacherAction}
        className="space-y-6 rounded-lg border bg-white p-6"
      >
        <div>
          <label
            htmlFor="employeeId"
            className="mb-2 block text-sm font-medium"
          >
            Employee ID
          </label>

          <input
            id="employeeId"
            name="employeeId"
            type="text"
            required
            placeholder="e.g. TCH-001"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="firstName"
              className="mb-2 block text-sm font-medium"
            >
              First Name
            </label>

            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="mb-2 block text-sm font-medium"
            >
              Last Name
            </label>

            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            placeholder="teacher@example.com"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-2 block text-sm font-medium">
            Phone
          </label>

          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="08012345678"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Create Teacher
          </button>

          <Link
            href="/school/teachers"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
