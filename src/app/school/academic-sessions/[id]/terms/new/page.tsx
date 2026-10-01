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

  const sessionStartDate = academicSession.startDate.toString().slice(0, 10);
  const sessionEndDate = academicSession.endDate.toString().slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-2 sm:px-4">
      {/* Header */}
      <div>
        <Link
          href={`/school/academic-sessions/${academicSession.id}`}
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to {academicSession.name}
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Academic Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Add Term
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add a term to the{" "}
            <span className="font-semibold text-slate-800">
              {academicSession.name}
            </span>{" "}
            academic session.
          </p>
        </div>
      </div>

      {/* Session information */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Academic Session
        </p>

        <p className="mt-1 font-semibold text-slate-900">
          {academicSession.name}
        </p>

        <p className="mt-1 text-sm text-slate-600">
          Session period: {sessionStartDate} — {sessionEndDate}
        </p>
      </div>

      {/* Form */}
      <form
        action={createTermAction}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <input type="hidden" name="sessionId" value={academicSession.id} />

        <section className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900">
              Term Information
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Select the term and define its academic period.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Term Name <span className="text-red-500">*</span>
              </label>

              <select
                id="name"
                name="name"
                required
                defaultValue=""
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="" disabled>
                  Select term
                </option>

                <option value="First Term">First Term</option>

                <option value="Second Term">Second Term</option>

                <option value="Third Term">Third Term</option>
              </select>
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
                  min={sessionStartDate}
                  max={sessionEndDate}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Must fall within the academic session dates.
                </p>
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
                  min={sessionStartDate}
                  max={sessionEndDate}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Must fall within the academic session dates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <Link
            href={`/school/academic-sessions/${academicSession.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Create Term
          </button>
        </div>
      </form>
    </div>
  );
}
