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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage the students in your school.
          </p>
        </div>

        <Link
          href="/school/students/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Add Student
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {students.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="font-semibold">No students yet</h2>

            <p className="mt-2 text-sm text-gray-500">
              Add your first student to get started.
            </p>

            <Link
              href="/school/students/new"
              className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Add Student
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Admission No.</th>

                  <th className="px-6 py-4 font-semibold">Student</th>

                  <th className="px-6 py-4 font-semibold">Gender</th>

                  <th className="px-6 py-4 font-semibold">Class</th>

                  <th className="px-6 py-4 font-semibold">Phone</th>

                  <th className="px-6 py-4 font-semibold">Attendance</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b last:border-0">
                    <td className="px-6 py-4">{student.admissionNumber}</td>

                    <td className="px-6 py-4 font-medium">
                      <Link
                        href={`/school/students/${student.id}`}
                        className="font-medium hover:underline"
                      >
                        {student.firstName}{" "}
                        {student.middleName ? `${student.middleName} ` : ""}
                        {student.lastName}
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {student.gender}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {student.classId
                        ? (classMap.get(student.classId) ?? "Unknown")
                        : "Not assigned"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {student.phone ?? "—"}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/school/students/${student.id}/attendance`}
                        className="text-blue-600 hover:underline"
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
