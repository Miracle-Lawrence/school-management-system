import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AttendanceHistoryPage({ params }: PageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const { id } = await params;
  const classId = Number(id);

  if (!Number.isInteger(classId)) {
    throw new Error("Invalid class.");
  }

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    throw new Error("Class not found.");
  }

  const attendanceRecords = await db.orm.public.Attendance.where((attendance) =>
    attendance.classId.eq(classId),
  ).all();

  const students = await db.orm.public.Student.where((student) =>
    student.classId.eq(classId),
  ).all();

  const studentMap = new Map(students.map((student) => [student.id, student]));

  const records = attendanceRecords
    .map((record) => {
      const student = studentMap.get(record.studentId);

      if (!student) {
        return null;
      }

      return {
        id: record.id,
        studentName: `${student.firstName} ${
          student.middleName ? `${student.middleName} ` : ""
        }${student.lastName}`,
        admissionNumber: student.admissionNumber,
        date: record.date.toString().slice(0, 10),
        status: record.status,
        notes: record.notes,
      };
    })
    .filter((record): record is NonNullable<typeof record> => record !== null)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/school/classes/${classId}/attendance`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Attendance
        </Link>

        <h1 className="mt-2 text-2xl font-bold">Attendance History</h1>

        <p className="text-gray-600">{schoolClass.name}</p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {records.length === 0 ? (
          <p className="text-gray-500">
            No attendance records have been recorded for this class yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-3">Date</th>

                  <th className="px-3 py-3">Admission Number</th>

                  <th className="px-3 py-3">Student</th>

                  <th className="px-3 py-3">Status</th>

                  <th className="px-3 py-3">Notes</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b">
                    <td className="px-3 py-3">{record.date}</td>

                    <td className="px-3 py-3">{record.admissionNumber}</td>

                    <td className="px-3 py-3 font-medium">
                      {record.studentName}
                    </td>

                    <td className="px-3 py-3">{record.status}</td>

                    <td className="px-3 py-3">{record.notes || "—"}</td>
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
