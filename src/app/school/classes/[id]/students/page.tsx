import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

type ClassStudentsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClassStudentsPage({
  params,
}: ClassStudentsPageProps) {
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

  const students = await db.orm.public.Student.where((student) =>
    student.classId.eq(classId),
  ).all();

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

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Class Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {schoolClass.name} Students
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            View students currently enrolled in this class.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-slate-600">Total students</p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {students.length}
        </p>
      </div>

      {/* Students */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <h2 className="font-semibold text-slate-900">Students</h2>

          <p className="mt-1 text-sm text-slate-600">
            Students currently assigned to {schoolClass.name}.
          </p>
        </div>

        {students.length === 0 ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-xl font-bold">S</span>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No students assigned
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              There are currently no students assigned to this class.
            </p>

            <Link
              href="/school/students"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Manage Students
            </Link>
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
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {student.admissionNumber}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/school/students/${student.id}`}
                        className="flex items-center gap-3"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                          {`${student.firstName.charAt(0)}${student.lastName.charAt(
                            0,
                          )}`.toUpperCase()}
                        </span>

                        <span className="font-semibold text-slate-900 transition hover:text-blue-600">
                          {student.firstName}{" "}
                          {student.middleName ? `${student.middleName} ` : ""}
                          {student.lastName}
                        </span>
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {student.gender}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {student.email || "—"}
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
