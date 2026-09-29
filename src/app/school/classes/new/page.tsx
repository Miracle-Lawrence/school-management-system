import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { createClassSchema } from "@/lib/validation/class";
import { createClass } from "@/lib/services/class.service";

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
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add Class</h1>

        <p className="mt-1 text-sm text-gray-500">
          Create a class for your school.
        </p>
      </div>

      <form
        action={createClassAction}
        className="space-y-6 rounded-lg border bg-white p-6"
      >
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Class Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. JSS 1A"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="level" className="mb-2 block text-sm font-medium">
            Level
          </label>

          <input
            id="level"
            name="level"
            type="text"
            placeholder="e.g. Junior Secondary"
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
            placeholder="Optional class description"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Create Class
          </button>

          <a
            href="/school/classes"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
