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
    <div className="space-y-8">
      <div>
        <Link
          href="/school/classes"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to Classes
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-bold">{schoolClass.name}</h1>

          <p className="mt-1 text-sm text-gray-500">
            Students enrolled in this class.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Students</h2>
        </div>

        {students.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            No students are currently assigned to this class.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium">Admission Number</th>

                  <th className="px-6 py-3 font-medium">Student</th>

                  <th className="px-6 py-3 font-medium">Gender</th>

                  <th className="px-6 py-3 font-medium">Email</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 font-medium">
                      {student.admissionNumber}
                    </td>

                    <td className="px-6 py-4">
                      {student.firstName}{" "}
                      {student.middleName ? `${student.middleName} ` : ""}
                      {student.lastName}
                    </td>

                    <td className="px-6 py-4">{student.gender}</td>

                    <td className="px-6 py-4">{student.email || "—"}</td>
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
