import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AttendanceSummaryPage({ params }: PageProps) {
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

  const students = await db.orm.public.Student.where((student) =>
    student.classId.eq(classId),
  ).all();

  const attendanceRecords = await db.orm.public.Attendance.where((attendance) =>
    attendance.classId.eq(classId),
  ).all();

  const studentMap = new Map(students.map((student) => [student.id, student]));

  const summaries = students
    .map((student) => {
      const records = attendanceRecords.filter(
        (record) => record.studentId === student.id,
      );

      const present = records.filter(
        (record) => record.status === "PRESENT",
      ).length;

      const absent = records.filter(
        (record) => record.status === "ABSENT",
      ).length;

      const late = records.filter((record) => record.status === "LATE").length;

      const excused = records.filter(
        (record) => record.status === "EXCUSED",
      ).length;

      const total = records.length;

      const attendancePercentage =
        total > 0 ? ((present + late) / total) * 100 : 0;

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${
          student.middleName ? `${student.middleName} ` : ""
        }${student.lastName}`,
        admissionNumber: student.admissionNumber,
        total,
        present,
        absent,
        late,
        excused,
        attendancePercentage,
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName));

  const totalRecords = attendanceRecords.length;

  const totalPresent = attendanceRecords.filter(
    (record) => record.status === "PRESENT",
  ).length;

  const totalAbsent = attendanceRecords.filter(
    (record) => record.status === "ABSENT",
  ).length;

  const totalLate = attendanceRecords.filter(
    (record) => record.status === "LATE",
  ).length;

  const totalExcused = attendanceRecords.filter(
    (record) => record.status === "EXCUSED",
  ).length;

  const overallPercentage =
    totalRecords > 0 ? ((totalPresent + totalLate) / totalRecords) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/school/classes/${classId}/attendance`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Attendance
        </Link>

        <h1 className="mt-2 text-2xl font-bold">Attendance Summary</h1>

        <p className="text-gray-600">{schoolClass.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Records</p>

          <p className="mt-2 text-2xl font-bold">{totalRecords}</p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Present</p>

          <p className="mt-2 text-2xl font-bold">{totalPresent}</p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Absent</p>

          <p className="mt-2 text-2xl font-bold">{totalAbsent}</p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Late</p>

          <p className="mt-2 text-2xl font-bold">{totalLate}</p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Overall Attendance</p>

          <p className="mt-2 text-2xl font-bold">
            {overallPercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Student Attendance</h2>

          <p className="text-sm text-gray-500">
            Attendance percentage counts Present and Late as attendance.
          </p>
        </div>

        {summaries.length === 0 ? (
          <p className="text-gray-500">
            No students are currently assigned to this class.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-3">Admission Number</th>

                  <th className="px-3 py-3">Student</th>

                  <th className="px-3 py-3">Total</th>

                  <th className="px-3 py-3">Present</th>

                  <th className="px-3 py-3">Absent</th>

                  <th className="px-3 py-3">Late</th>

                  <th className="px-3 py-3">Excused</th>

                  <th className="px-3 py-3">Attendance</th>
                </tr>
              </thead>

              <tbody>
                {summaries.map((summary) => (
                  <tr key={summary.studentId} className="border-b">
                    <td className="px-3 py-3">{summary.admissionNumber}</td>

                    <td className="px-3 py-3 font-medium">
                      {summary.studentName}
                    </td>

                    <td className="px-3 py-3">{summary.total}</td>

                    <td className="px-3 py-3">{summary.present}</td>

                    <td className="px-3 py-3">{summary.absent}</td>

                    <td className="px-3 py-3">{summary.late}</td>

                    <td className="px-3 py-3">{summary.excused}</td>

                    <td className="px-3 py-3 font-semibold">
                      {summary.attendancePercentage.toFixed(1)}%
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
