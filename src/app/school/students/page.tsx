import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export default async function StudentsPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const students = await db.orm.public.Student.where((student) =>
    student.schoolId.eq(schoolId),
  ).all();

  const classes = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.schoolId.eq(schoolId),
  ).all();

  const classMap = new Map(
    classes.map((schoolClass) => [schoolClass.id, schoolClass.name]),
  );

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Student Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Students
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Manage student records, classes, and attendance.
          </p>
        </div>

        <Link
          href="/school/students/new"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Add Student
        </Link>
      </div>

      {/* Student count */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-slate-600">Total students</p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {students.length}
        </p>
      </div>

      {/* Students table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {students.length === 0 ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-xl font-bold">S</span>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No students yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Add your first student to begin building your school's student
              records.
            </p>

            <Link
              href="/school/students/new"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Add Student
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Admission No.
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Student
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Gender
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Class
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Phone
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Attendance
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {student.admissionNumber}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/school/students/${student.id}`}
                        className="font-semibold text-slate-900 transition hover:text-blue-600"
                      >
                        {student.firstName}{" "}
                        {student.middleName ? `${student.middleName} ` : ""}
                        {student.lastName}
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {student.gender}
                    </td>

                    <td className="px-6 py-4">
                      {student.classId ? (
                        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {classMap.get(student.classId) ?? "Unknown"}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          Not assigned
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {student.phone ?? "—"}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/school/students/${student.id}/attendance`}
                        className="inline-flex rounded-md px-2.5 py-1.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
