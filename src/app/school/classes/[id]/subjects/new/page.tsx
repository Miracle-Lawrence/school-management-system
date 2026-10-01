import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { assignSubjectToClass } from "@/lib/services/class-subject.service";
import { db } from "@/prisma/db";

type AssignSubjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AssignSubjectPage({
  params,
}: AssignSubjectPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const classId = Number(id);

  if (!Number.isInteger(classId)) {
    notFound();
  }

  const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    notFound();
  }

  const subjects = await db.orm.public.Subject.where((subject) =>
    subject.schoolId.eq(schoolId),
  ).all();

  const assignments = await db.orm.public.ClassSubject.where((assignment) =>
    assignment.classId.eq(classId),
  ).all();

  const assignedSubjectIds = new Set(
    assignments.map((assignment) => assignment.subjectId),
  );

  const availableSubjects = subjects.filter(
    (subject) => !assignedSubjectIds.has(subject.id),
  );

  async function assignSubjectAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const subjectId = Number(formData.get("subjectId"));

    if (!Number.isInteger(subjectId)) {
      throw new Error("Invalid subject.");
    }

    await assignSubjectToClass(schoolId, classId, subjectId);

    redirect(`/school/classes/${classId}/subjects`);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-2 sm:px-4">
      <div>
        <Link
          href={`/school/classes/${classId}/subjects`}
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Class Subjects
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Class Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Assign Subject
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Select a subject to add to{" "}
            <span className="font-semibold text-slate-900">
              {schoolClass.name}
            </span>
            .
          </p>
        </div>
      </div>

      <form
        action={assignSubjectAction}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <section className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900">
              Subject Assignment
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Choose one of the school&apos;s available subjects to assign to
              this class.
            </p>
          </div>

          {availableSubjects.length === 0 ? (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-blue-600">
                  <span className="font-bold">✓</span>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">
                    All subjects are already assigned
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Every subject currently available in your school has already
                    been assigned to {schoolClass.name}.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label
                htmlFor="subjectId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Subject <span className="text-red-500">*</span>
              </label>

              <select
                id="subjectId"
                name="subjectId"
                required
                defaultValue=""
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="" disabled>
                  Select a subject
                </option>

                {availableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                    {subject.code ? ` (${subject.code})` : ""}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-slate-500">
                Only subjects that have not already been assigned to this class
                are shown.
              </p>
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <Link
            href={`/school/classes/${classId}/subjects`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          {availableSubjects.length > 0 && (
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Assign Subject
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
