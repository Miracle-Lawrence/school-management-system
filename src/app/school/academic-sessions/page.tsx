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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Academic Sessions</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your school's academic sessions.
          </p>
        </div>

        <Link
          href="/school/academic-sessions/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Add Session
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {sessions.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="font-semibold">No academic sessions yet</h2>

            <p className="mt-2 text-sm text-gray-500">
              Create your first academic session to get started.
            </p>

            <Link
              href="/school/academic-sessions/new"
              className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Add Session
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Session</th>

                  <th className="px-6 py-4 font-semibold">Start Date</th>

                  <th className="px-6 py-4 font-semibold">End Date</th>

                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {sessions.map((academicSession) => (
                  <tr
                    key={academicSession.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-6 py-4 font-medium">
                      <Link
                        href={`/school/academic-sessions/${academicSession.id}`}
                        className="hover:underline"
                      >
                        {academicSession.name}
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {academicSession.startDate.toString().slice(0, 10)}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {academicSession.endDate.toString().slice(0, 10)}
                    </td>

                    <td className="px-6 py-4">
                      {academicSession.isActive ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
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
