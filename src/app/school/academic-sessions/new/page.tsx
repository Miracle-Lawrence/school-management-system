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
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add Academic Session</h1>

        <p className="mt-1 text-sm text-gray-500">
          Create a new academic session for your school.
        </p>
      </div>

      <form
        action={createAcademicSessionAction}
        className="space-y-6 rounded-lg border bg-white p-6"
      >
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Session Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. 2026/2027"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="startDate" className="mb-2 block text-sm font-medium">
            Start Date
          </label>

          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="mb-2 block text-sm font-medium">
            End Date
          </label>

          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Create Session
          </button>

          <Link
            href="/school/academic-sessions"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
