import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { assignTeacherToClassSubject } from "@/lib/services/teacher-assignment.service";
import { db } from "@/prisma/db";

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

  const canAssign = teachers.length > 0 && availableSubjects.length > 0;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-2 sm:px-4">
      <div>
        <Link
          href={`/school/classes/${classId}/teachers`}
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Teacher Assignments
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Class Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Assign Teacher
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Assign a teacher to a subject in{" "}
            <span className="font-semibold text-slate-900">
              {schoolClass.name}
            </span>
            .
          </p>
        </div>
      </div>

      <form
        action={assignTeacherAction}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <section className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900">
              Teacher Assignment
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Select a teacher and one of the subjects assigned to this class.
            </p>
          </div>

          <div className="space-y-6">
            {/* Teacher */}
            <div>
              <label
                htmlFor="teacherId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Teacher <span className="text-red-500">*</span>
              </label>

              {teachers.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">
                    No teachers available
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    Add at least one teacher to your school before creating a
                    teacher assignment.
                  </p>

                  <Link
                    href="/school/teachers/new"
                    className="mt-3 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    + Add Teacher
                  </Link>
                </div>
              ) : (
                <>
                  <select
                    id="teacherId"
                    name="teacherId"
                    required
                    defaultValue=""
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="" disabled>
                      Select a teacher
                    </option>

                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName} —{" "}
                        {teacher.employeeId}
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-xs text-slate-500">
                    Select the teacher responsible for teaching the subject.
                  </p>
                </>
              )}
            </div>

            {/* Subject */}
            <div>
              <label
                htmlFor="subjectId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Subject <span className="text-red-500">*</span>
              </label>

              {availableSubjects.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">
                    No subjects available
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    Assign at least one subject to {schoolClass.name} before
                    assigning a teacher.
                  </p>

                  <Link
                    href={`/school/classes/${classId}/subjects/new`}
                    className="mt-3 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    + Assign Subject
                  </Link>
                </div>
              ) : (
                <>
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
                    Only subjects already assigned to this class are shown.
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <Link
            href={`/school/classes/${classId}/teachers`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          {canAssign && (
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Assign Teacher
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
