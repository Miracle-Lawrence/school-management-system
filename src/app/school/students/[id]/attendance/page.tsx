import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    sessionId?: string;
    termId?: string;
    date?: string;
  }>;
};

export default async function StudentAttendancePage({
  params,
  searchParams,
}: PageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const { id } = await params;
  const { sessionId, termId, date } = await searchParams;

  const studentId = Number(id);

  if (!Number.isInteger(studentId)) {
    throw new Error("Invalid student.");
  }

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const student = await db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    throw new Error("Student not found.");
  }

  const academicSessions = await db.orm.public.AcademicSession.where(
    (academicSession) => academicSession.schoolId.eq(schoolId),
  ).all();

  const selectedSessionId =
    sessionId && Number.isInteger(Number(sessionId)) ? Number(sessionId) : null;

  const selectedTermId =
    termId && Number.isInteger(Number(termId)) ? Number(termId) : null;

  let terms: Awaited<ReturnType<typeof db.orm.public.Term.all>> = [];

  if (selectedSessionId) {
    const selectedSession = academicSessions.find(
      (academicSession) => academicSession.id === selectedSessionId,
    );

    if (selectedSession) {
      terms = await db.orm.public.Term.where((term) =>
        term.sessionId.eq(selectedSessionId),
      ).all();
    }
  }

  const attendanceRecords = await db.orm.public.Attendance.where((attendance) =>
    attendance.studentId.eq(studentId),
  ).all();

  const filteredRecords = attendanceRecords.filter((record) => {
    if (selectedTermId && record.termId !== selectedTermId) {
      return false;
    }

    if (date) {
      const recordDate = record.date.toString().slice(0, 10);

      if (recordDate !== date) {
        return false;
      }
    }

    if (selectedSessionId) {
      const matchingTerm = terms.find((term) => term.id === record.termId);

      if (!matchingTerm) {
        return false;
      }
    }

    return true;
  });

  const total = filteredRecords.length;

  const present = filteredRecords.filter(
    (record) => record.status === "PRESENT",
  ).length;

  const absent = filteredRecords.filter(
    (record) => record.status === "ABSENT",
  ).length;

  const late = filteredRecords.filter(
    (record) => record.status === "LATE",
  ).length;

  const excused = filteredRecords.filter(
    (record) => record.status === "EXCUSED",
  ).length;

  const attendancePercentage = total > 0 ? ((present + late) / total) * 100 : 0;

  const records = filteredRecords
    .map((record) => ({
      id: record.id,
      date: record.date.toString().slice(0, 10),
      status: record.status,
      notes: record.notes,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/school/students/${studentId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Student
        </Link>

        <h1 className="mt-2 text-2xl font-bold">Student Attendance</h1>

        <p className="text-gray-600">
          {student.firstName}{" "}
          {student.middleName ? `${student.middleName} ` : ""}
          {student.lastName}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Admission Number: {student.admissionNumber}
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form method="GET" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="session" className="block text-sm font-medium">
              Academic Session
            </label>

            <select
              id="session"
              name="sessionId"
              defaultValue={selectedSessionId ? String(selectedSessionId) : ""}
              className="mt-2 w-full rounded-md border px-3 py-2"
            >
              <option value="">All Sessions</option>

              {academicSessions.map((academicSession) => (
                <option key={academicSession.id} value={academicSession.id}>
                  {academicSession.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="term" className="block text-sm font-medium">
              Term
            </label>

            {!selectedSessionId && (
              <p className="mt-1 text-xs text-gray-500">
                Select an academic session first.
              </p>
            )}

            <select
              id="term"
              name="termId"
              defaultValue={selectedTermId ? String(selectedTermId) : ""}
              disabled={!selectedSessionId}
              className="mt-2 w-full rounded-md border px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">
                {selectedSessionId ? "All Terms" : "Select a session first"}
              </option>

              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="attendance-date"
              className="block text-sm font-medium"
            >
              Date
            </label>

            <input
              id="attendance-date"
              name="date"
              type="date"
              defaultValue={date ?? ""}
              className="mt-2 w-full rounded-md border px-3 py-2"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Filter
            </button>

            {(date || selectedSessionId || selectedTermId) && (
              <Link
                href={`/school/students/${studentId}/attendance`}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Clear
              </Link>
            )}

            <a
              href={`/api/school/students/${studentId}/attendance/pdf${
                date || selectedSessionId || selectedTermId
                  ? `?${new URLSearchParams({
                      ...(date ? { date } : {}),
                      ...(selectedSessionId
                        ? {
                            sessionId: String(selectedSessionId),
                          }
                        : {}),
                      ...(selectedTermId
                        ? {
                            termId: String(selectedTermId),
                          }
                        : {}),
                    }).toString()}`
                  : ""
              }`}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Download PDF
            </a>
          </div>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Records</p>

          <p className="mt-2 text-2xl font-bold">{total}</p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Present</p>

          <p className="mt-2 text-2xl font-bold">{present}</p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Absent</p>

          <p className="mt-2 text-2xl font-bold">{absent}</p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Late</p>

          <p className="mt-2 text-2xl font-bold">{late}</p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Attendance</p>

          <p className="mt-2 text-2xl font-bold">
            {attendancePercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Attendance History</h2>

          <p className="text-sm text-gray-500">
            Present and Late count as attendance.
          </p>
        </div>

        {records.length === 0 ? (
          <p className="text-gray-500">
            No attendance records found for the selected filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-3">Date</th>

                  <th className="px-3 py-3">Status</th>

                  <th className="px-3 py-3">Notes</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b">
                    <td className="px-3 py-3">{record.date}</td>

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
