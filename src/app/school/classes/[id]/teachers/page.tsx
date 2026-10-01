import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

type ClassTeachersPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClassTeachersPage({
  params,
}: ClassTeachersPageProps) {
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

  const assignments = await db.orm.public.TeacherAssignment.where(
    (assignment) => assignment.classId.eq(classId),
  ).all();

  const teachers = await db.orm.public.Teacher.where((teacher) =>
    teacher.schoolId.eq(schoolId),
  ).all();

  const subjects = await db.orm.public.Subject.where((subject) =>
    subject.schoolId.eq(schoolId),
  ).all();

  const assignmentDetails = assignments.map((assignment) => {
    const teacher = teachers.find(
      (teacher) => teacher.id === assignment.teacherId,
    );

    const subject = subjects.find(
      (subject) => subject.id === assignment.subjectId,
    );

    return {
      assignment,
      teacher,
      subject,
    };
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-2 sm:px-4">
      {/* Page heading */}
      <div>
        <Link
          href={`/school/classes/${classId}`}
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to {schoolClass.name}
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Class Management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {schoolClass.name} Teachers
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage teachers and subjects assigned to this class.
            </p>
          </div>

          <Link
            href={`/school/classes/${classId}/teachers/new`}
            className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Assign Teacher
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Teacher Assignments
        </p>

        <p className="mt-2 text-2xl font-bold text-slate-900">
          {assignmentDetails.length}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Teacher and subject assignments for this class
        </p>
      </div>

      {/* Assignments */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Teacher Assignments
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Teachers currently assigned to {schoolClass.name}.
              </p>
            </div>

            <span className="inline-flex w-fit min-w-8 items-center justify-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {assignmentDetails.length}
            </span>
          </div>
        </div>

        {assignmentDetails.length === 0 ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-xl font-bold">T</span>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No teachers assigned
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Assign teachers to subjects for this class to begin managing
              teaching responsibilities.
            </p>

            <Link
              href={`/school/classes/${classId}/teachers/new`}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Assign Teacher
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Teacher
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Subject
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Employee ID
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {assignmentDetails.map(({ assignment, teacher, subject }) => (
                  <tr
                    key={assignment.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      {teacher ? (
                        <Link
                          href={`/school/teachers/${teacher.id}`}
                          className="flex items-center gap-3"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                            {`${teacher.firstName.charAt(
                              0,
                            )}${teacher.lastName.charAt(0)}`.toUpperCase()}
                          </span>

                          <span className="font-semibold text-slate-900 transition hover:text-blue-600">
                            {teacher.firstName} {teacher.lastName}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {subject ? (
                        <Link
                          href={`/school/subjects/${subject.id}`}
                          className="font-medium text-slate-900 transition hover:text-blue-600"
                        >
                          {subject.name}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {teacher?.employeeId ? (
                        <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {teacher.employeeId}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
