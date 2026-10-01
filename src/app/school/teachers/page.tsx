import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export default async function TeachersPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const teachers = await db.orm.public.Teacher.where((teacher) =>
    teacher.schoolId.eq(schoolId),
  ).all();

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Staff Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Teachers
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Manage teacher records and staff information.
          </p>
        </div>

        <Link
          href="/school/teachers/new"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Add Teacher
        </Link>
      </div>

      {/* Teacher count */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-slate-600">Total teachers</p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {teachers.length}
        </p>
      </div>

      {/* Teachers table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {teachers.length === 0 ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-xl font-bold">T</span>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No teachers yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Add your first teacher to begin managing your school's teaching
              staff.
            </p>

            <Link
              href="/school/teachers/new"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Add Teacher
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Employee ID
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Teacher
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Email
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Phone
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {teacher.employeeId}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/school/teachers/${teacher.id}`}
                        className="font-semibold text-slate-900 transition hover:text-blue-600"
                      >
                        {teacher.firstName} {teacher.lastName}
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {teacher.email ?? "—"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {teacher.phone ?? "—"}
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
