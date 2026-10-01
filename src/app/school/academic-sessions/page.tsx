import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export default async function AcademicSessionsPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const sessions = await db.orm.public.AcademicSession.where(
    (academicSession) => academicSession.schoolId.eq(schoolId),
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
            Academic Sessions
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Manage your school's academic sessions and school years.
          </p>
        </div>

        <Link
          href="/school/academic-sessions/new"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Add Session
        </Link>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-slate-600">Total academic sessions</p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {sessions.length}
        </p>
      </div>

      {/* Sessions */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {sessions.length === 0 ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-xl font-bold">A</span>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No academic sessions yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Create your first academic session to start managing your school's
              academic calendar.
            </p>

            <Link
              href="/school/academic-sessions/new"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Add Session
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Session
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Start Date
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    End Date
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sessions.map((academicSession) => (
                  <tr
                    key={academicSession.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/school/academic-sessions/${academicSession.id}`}
                        className="font-semibold text-slate-900 transition hover:text-blue-600"
                      >
                        {academicSession.name}
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {academicSession.startDate.toString().slice(0, 10)}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {academicSession.endDate.toString().slice(0, 10)}
                    </td>

                    <td className="px-6 py-4">
                      {academicSession.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Inactive
                        </span>
                      )}
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
