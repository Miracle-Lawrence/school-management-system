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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Classes</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage the classes in your school.
          </p>
        </div>

        <Link
          href="/school/classes/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Add Class
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {classes.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="font-semibold">No classes yet</h2>

            <p className="mt-2 text-sm text-gray-500">
              Create your first class to start organizing students.
            </p>

            <Link
              href="/school/classes/new"
              className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Add Class
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Class</th>

                  <th className="px-6 py-4 font-semibold">Level</th>

                  <th className="px-6 py-4 font-semibold">Description</th>
                </tr>
              </thead>

              <tbody>
                {classes.map((schoolClass) => (
                  <tr key={schoolClass.id} className="border-b last:border-0">
                    <td className="px-6 py-4 font-medium">
                      {schoolClass.name}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {schoolClass.level ?? "—"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {schoolClass.description ?? "—"}
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
