import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export default async function ClassesPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const classes = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.schoolId.eq(schoolId),
  ).all();

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Academic Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Classes
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Manage the classes in your school and organize their academic
            activities.
          </p>
        </div>

        <Link
          href="/school/classes/new"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Add Class
        </Link>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-slate-600">Total classes</p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {classes.length}
        </p>
      </div>

      {/* Classes table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {classes.length === 0 ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-xl font-bold">C</span>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No classes yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Create your first class to start organizing students, subjects,
              teachers, and attendance.
            </p>

            <Link
              href="/school/classes/new"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Add Class
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Class
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Level
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Description
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Manage
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {classes.map((schoolClass) => (
                  <tr
                    key={schoolClass.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/school/classes/${schoolClass.id}`}
                        className="font-semibold text-slate-900 transition hover:text-blue-600"
                      >
                        {schoolClass.name}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      {schoolClass.level ? (
                        <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {schoolClass.level}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="max-w-sm px-6 py-4 text-slate-600">
                      {schoolClass.description ?? "—"}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/school/classes/${schoolClass.id}/students`}
                          className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                        >
                          Students
                        </Link>

                        <Link
                          href={`/school/classes/${schoolClass.id}/subjects`}
                          className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                        >
                          Subjects
                        </Link>

                        <Link
                          href={`/school/classes/${schoolClass.id}/teachers`}
                          className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                        >
                          Teachers
                        </Link>

                        <Link
                          href={`/school/classes/${schoolClass.id}/attendance`}
                          className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          Attendance
                        </Link>

                        <Link
                          href={`/school/classes/${schoolClass.id}/attendance/history`}
                          className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          History
                        </Link>

                        <Link
                          href={`/school/classes/${schoolClass.id}/attendance/summary`}
                          className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          Summary
                        </Link>
                      </div>
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
