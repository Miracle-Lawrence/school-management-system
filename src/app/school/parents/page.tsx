import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export default async function ParentsPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const parents = await db.orm.public.Parent.where((parent) =>
    parent.schoolId.eq(schoolId),
  ).all();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Parents</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage the parents and guardians in your school.
          </p>
        </div>

        <Link
          href="/school/parents/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Add Parent
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {parents.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="font-semibold">No parents yet</h2>

            <p className="mt-2 text-sm text-gray-500">
              Add your first parent to get started.
            </p>

            <Link
              href="/school/parents/new"
              className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Add Parent
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Parent</th>

                  <th className="px-6 py-4 font-semibold">Email</th>

                  <th className="px-6 py-4 font-semibold">Phone</th>

                  <th className="px-6 py-4 font-semibold">Address</th>
                </tr>
              </thead>

              <tbody>
                {parents.map((parent) => (
                  <tr key={parent.id} className="border-b last:border-0">
                    <td className="px-6 py-4 font-medium">
                      {parent.firstName} {parent.lastName}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {parent.email ?? "—"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {parent.phone ?? "—"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {parent.address ?? "—"}
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
