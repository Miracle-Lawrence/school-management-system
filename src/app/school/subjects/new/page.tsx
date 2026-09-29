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
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add Subject</h1>

        <p className="mt-1 text-sm text-gray-500">
          Add a subject offered by your school.
        </p>
      </div>

      <form
        action={createSubjectAction}
        className="space-y-6 rounded-lg border bg-white p-6"
      >
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Subject Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Mathematics"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="code" className="mb-2 block text-sm font-medium">
            Subject Code
          </label>

          <input
            id="code"
            name="code"
            type="text"
            placeholder="e.g. MATH"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium"
          >
            Description
          </label>

          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Optional subject description"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Create Subject
          </button>

          <Link
            href="/school/subjects"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
