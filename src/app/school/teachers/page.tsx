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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teachers</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage the teachers in your school.
          </p>
        </div>

        <Link
          href="/school/teachers/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Add Teacher
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {teachers.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="font-semibold">No teachers yet</h2>

            <p className="mt-2 text-sm text-gray-500">
              Add your first teacher to get started.
            </p>

            <Link
              href="/school/teachers/new"
              className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Add Teacher
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Employee ID</th>

                  <th className="px-6 py-4 font-semibold">Teacher</th>

                  <th className="px-6 py-4 font-semibold">Email</th>

                  <th className="px-6 py-4 font-semibold">Phone</th>
                </tr>
              </thead>

              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b last:border-0">
                    <td className="px-6 py-4 font-medium">
                      {teacher.employeeId}
                    </td>

                    <td className="px-6 py-4">
                      {teacher.firstName} {teacher.lastName}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {teacher.email ?? "—"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
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
