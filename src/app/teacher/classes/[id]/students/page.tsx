import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

type ClassStudentsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TeacherClassStudentsPage({
  params,
}: ClassStudentsPageProps) {
  const session = await requireRole(["TEACHER"]);
  const schoolId = session.user.schoolId;
  const userId = Number(session.user.id);

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const classId = Number(id);

  if (!Number.isInteger(classId) || classId <= 0) {
    notFound();
  }

  const teacher = await db.orm.public.Teacher.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    notFound();
  }

  // Verify that this teacher is assigned to the requested class.
  const assignments = await db.orm.public.TeacherAssignment.where(
    (assignment) => assignment.teacherId.eq(teacher.id),
  ).all();

  const isAssignedToClass = assignments.some(
    (assignment) => assignment.classId === classId,
  );

  if (!isAssignedToClass) {
    notFound();
  }

  const schoolClass = await db.orm.public.SchoolClass.where((item) =>
    item.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    notFound();
  }

  const students = await db.orm.public.Student.where((student) =>
    student.classId.eq(classId),
  ).all();

  const sortedStudents = students.sort((a, b) => {
    const lastNameComparison = a.lastName.localeCompare(b.lastName);

    if (lastNameComparison !== 0) {
      return lastNameComparison;
    }

    return a.firstName.localeCompare(b.firstName);
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-2 sm:px-4">
      <div>
        <Link
          href="/teacher/classes"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to My Classes
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Teaching & Learning
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {schoolClass.name} Students
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            View the students assigned to your class.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-600">Total students</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {students.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-600">Active students</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {students.filter((student) => student.isActive).length}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <h2 className="font-semibold text-slate-900">Student directory</h2>
          <p className="mt-1 text-sm text-slate-600">
            Students currently assigned to {schoolClass.name}.
          </p>
        </div>

        {sortedStudents.length === 0 ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-xl font-bold">S</span>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No students assigned
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              There are currently no students assigned to this class. Contact
              your school administrator if you think this is an error.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Admission Number
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Student
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Gender
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Email
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sortedStudents.map((student) => (
                  <tr key={student.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {student.admissionNumber}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                          {`${student.firstName.charAt(0)}${student.lastName.charAt(
                            0,
                          )}`.toUpperCase()}
                        </span>

                        <span className="font-semibold text-slate-900">
                          {student.firstName}{" "}
                          {student.middleName ? `${student.middleName} ` : ""}
                          {student.lastName}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {student.gender}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {student.email || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          student.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {student.isActive ? "Active" : "Inactive"}
                      </span>
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
