import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { assignTeacherToClassSubject } from "@/lib/services/teacher-assignment.service";

type AssignTeacherPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AssignTeacherPage({
  params,
}: AssignTeacherPageProps) {
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

  const teachers = await db.orm.public.Teacher.where((teacher) =>
    teacher.schoolId.eq(schoolId),
  ).all();

  const subjects = await db.orm.public.Subject.where((subject) =>
    subject.schoolId.eq(schoolId),
  ).all();

  const classSubjects = await db.orm.public.ClassSubject.where((assignment) =>
    assignment.classId.eq(classId),
  ).all();

  const availableSubjects = subjects.filter((subject) =>
    classSubjects.some((assignment) => assignment.subjectId === subject.id),
  );

  async function assignTeacherAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const teacherId = Number(formData.get("teacherId"));

    const subjectId = Number(formData.get("subjectId"));

    if (!Number.isInteger(teacherId)) {
      throw new Error("Invalid teacher.");
    }

    if (!Number.isInteger(subjectId)) {
      throw new Error("Invalid subject.");
    }

    await assignTeacherToClassSubject(schoolId, teacherId, classId, subjectId);

    redirect(`/school/classes/${classId}/teachers`);
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link
          href={`/school/classes/${classId}/teachers`}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to Teacher Assignments
        </Link>

        <h1 className="mt-4 text-2xl font-bold">Assign Teacher</h1>

        <p className="mt-1 text-sm text-gray-500">
          Assign a teacher to a subject in {schoolClass.name}.
        </p>
      </div>

      <form
        action={assignTeacherAction}
        className="space-y-6 rounded-lg border bg-white p-6"
      >
        <div>
          <label htmlFor="teacherId" className="mb-2 block text-sm font-medium">
            Teacher
          </label>

          {teachers.length === 0 ? (
            <p className="text-sm text-gray-500">
              No teachers have been added to this school yet.
            </p>
          ) : (
            <select
              id="teacherId"
              name="teacherId"
              required
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">Select a teacher</option>

              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.firstName} {teacher.lastName} — {teacher.employeeId}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor="subjectId" className="mb-2 block text-sm font-medium">
            Subject
          </label>

          {availableSubjects.length === 0 ? (
            <p className="text-sm text-gray-500">
              No subjects have been assigned to this class yet.
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

        {teachers.length > 0 && availableSubjects.length > 0 && (
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Assign Teacher
            </button>

            <Link
              href={`/school/classes/${classId}/teachers`}
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
