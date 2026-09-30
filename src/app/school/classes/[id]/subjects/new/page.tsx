import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { assignSubjectToClass } from "@/lib/services/class-subject.service";

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
    <div className="max-w-2xl space-y-8">
      <div>
        <Link
          href={`/school/classes/${classId}/subjects`}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to Class Subjects
        </Link>

        <h1 className="mt-4 text-2xl font-bold">Assign Subject</h1>

        <p className="mt-1 text-sm text-gray-500">
          Assign a subject to {schoolClass.name}.
        </p>
      </div>

      <form
        action={assignSubjectAction}
        className="space-y-6 rounded-lg border bg-white p-6"
      >
        <div>
          <label htmlFor="subjectId" className="mb-2 block text-sm font-medium">
            Subject
          </label>

          {availableSubjects.length === 0 ? (
            <p className="text-sm text-gray-500">
              All available subjects have already been assigned to this class.
            </p>
          ) : (
            <select
              id="subjectId"
              name="subjectId"
              required
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">Select a subject</option>

              {availableSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                  {subject.code ? ` (${subject.code})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {availableSubjects.length > 0 && (
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Assign Subject
            </button>

            <Link
              href={`/school/classes/${classId}/subjects`}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}
