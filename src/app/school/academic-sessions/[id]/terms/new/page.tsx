import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { createTerm } from "@/lib/services/term.service";
import { createTermSchema } from "@/lib/validation/term";

type NewTermPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewTermPage({ params }: NewTermPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const sessionId = Number(id);

  if (!Number.isInteger(sessionId)) {
    notFound();
  }

  const academicSession = await db.orm.public.AcademicSession.where(
    (academicSession) => academicSession.id.eq(sessionId),
  ).first();

  if (!academicSession || academicSession.schoolId !== schoolId) {
    notFound();
  }

  async function createTermAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const result = createTermSchema.safeParse({
      sessionId: formData.get("sessionId"),
      name: formData.get("name"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    });

    if (!result.success) {
      throw new Error(
        result.error.issues[0]?.message ?? "Invalid term information.",
      );
    }

    await createTerm(schoolId, {
      sessionId: Number(result.data.sessionId),
      name: result.data.name,
      startDate: result.data.startDate,
      endDate: result.data.endDate,
    });

    redirect(`/school/academic-sessions/${result.data.sessionId}`);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="mb-2">
          <Link
            href={`/school/academic-sessions/${academicSession.id}`}
            className="text-sm text-gray-500 hover:underline"
          >
            ← {academicSession.name}
          </Link>
        </div>

        <h1 className="text-2xl font-bold">Add Term</h1>

        <p className="mt-1 text-sm text-gray-500">
          Add a term to the {academicSession.name} academic session.
        </p>
      </div>

      <form
        action={createTermAction}
        className="space-y-6 rounded-lg border bg-white p-6"
      >
        <input type="hidden" name="sessionId" value={academicSession.id} />

        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Term Name
          </label>

          <select
            id="name"
            name="name"
            required
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          >
            <option value="">Select term</option>

            <option value="First Term">First Term</option>

            <option value="Second Term">Second Term</option>

            <option value="Third Term">Third Term</option>
          </select>
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
            min={academicSession.startDate.toString().slice(0, 10)}
            max={academicSession.endDate.toString().slice(0, 10)}
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
            min={academicSession.startDate.toString().slice(0, 10)}
            max={academicSession.endDate.toString().slice(0, 10)}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Create Term
          </button>

          <Link
            href={`/school/academic-sessions/${academicSession.id}`}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
