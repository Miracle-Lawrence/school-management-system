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
    <div className="mx-auto w-full max-w-6xl space-y-6 px-2 sm:px-4">
      {/* Page heading */}
      <div>
        <Link
          href={`/school/classes/${classId}/attendance`}
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Attendance
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Class Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Attendance Summary
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Attendance overview for{" "}
            <span className="font-semibold text-slate-900">
              {schoolClass.name}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total Records
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {totalRecords}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Attendance records recorded
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Present
          </p>

          <p className="mt-2 text-2xl font-bold text-green-700">
            {totalPresent}
          </p>

          <p className="mt-1 text-sm text-slate-500">Present records</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Absent
          </p>

          <p className="mt-2 text-2xl font-bold text-red-600">{totalAbsent}</p>

          <p className="mt-1 text-sm text-slate-500">Absent records</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Late
          </p>

          <p className="mt-2 text-2xl font-bold text-amber-600">{totalLate}</p>

          <p className="mt-1 text-sm text-slate-500">Late records</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Overall Attendance
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-700">
            {overallPercentage.toFixed(1)}%
          </p>

          <p className="mt-1 text-sm text-blue-600">Present + Late records</p>
        </div>
      </div>

      {/* Student summaries */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <h2 className="font-semibold text-slate-900">Student Attendance</h2>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Attendance percentage counts both Present and Late records as
            attendance.
          </p>
        </div>

        {summaries.length === 0 ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-xl font-bold">S</span>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No students assigned
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              There are currently no students assigned to {schoolClass.name}.
            </p>

            <Link
              href={`/school/classes/${classId}/students`}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              View Class Students
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Admission Number
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Student
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Total
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Present
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Absent
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Late
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Excused
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Attendance
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {summaries.map((summary) => (
                  <tr
                    key={summary.studentId}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {summary.admissionNumber}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/school/students/${summary.studentId}`}
                        className="flex items-center gap-3"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                          {summary.studentName
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((name) => name.charAt(0))
                            .join("")
                            .toUpperCase()}
                        </span>

                        <span className="font-semibold text-slate-900 transition hover:text-blue-600">
                          {summary.studentName}
                        </span>
                      </Link>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {summary.total}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-green-700">
                        {summary.present}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-red-600">
                        {summary.absent}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-amber-600">
                        {summary.late}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-600">
                        {summary.excused}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {summary.attendancePercentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
