import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    date?: string;
    sessionId?: string;
    termId?: string;
  }>;
};

export default async function AttendanceHistoryPage({
  params,
  searchParams,
}: PageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const { id } = await params;
  const { date, sessionId, termId } = await searchParams;

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
    attendance.classId.eq(classId),
  ).all();

  const students = await db.orm.public.Student.where((student) =>
    student.classId.eq(classId),
  ).all();

  const studentMap = new Map(students.map((student) => [student.id, student]));

  const records = attendanceRecords
    .filter((record) => {
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
    })
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

  const pdfQuery =
    date || selectedSessionId || selectedTermId
      ? `?${new URLSearchParams({
          ...(date ? { date } : {}),
          ...(selectedSessionId
            ? { sessionId: String(selectedSessionId) }
            : {}),
          ...(selectedTermId ? { termId: String(selectedTermId) } : {}),
        }).toString()}`
      : "";

  const hasFilters = Boolean(date || selectedSessionId || selectedTermId);

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
            Attendance History
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            View attendance records for{" "}
            <span className="font-semibold text-slate-900">
              {schoolClass.name}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h2 className="font-semibold text-slate-900">
            Filter Attendance Records
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Filter attendance by academic session, term, or date.
          </p>
        </div>

        <form method="GET" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="session"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Academic Session
            </label>

            <select
              id="session"
              name="sessionId"
              defaultValue={selectedSessionId ? String(selectedSessionId) : ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            <label
              htmlFor="term"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Term
            </label>

            {!selectedSessionId && (
              <p className="mb-2 text-xs text-slate-500">
                Select an academic session first.
              </p>
            )}

            <select
              id="term"
              name="termId"
              defaultValue={selectedTermId ? String(selectedTermId) : ""}
              disabled={!selectedSessionId}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Date
            </label>

            <input
              id="attendance-date"
              name="date"
              type="date"
              defaultValue={date ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Filter
            </button>

            {hasFilters && (
              <Link
                href={`/school/classes/${classId}/attendance/history`}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {records.length} {records.length === 1 ? "record" : "records"}{" "}
              found
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Download the current filtered results as a PDF.
            </p>
          </div>

          <a
            href={`/api/school/classes/${classId}/attendance/history/pdf${pdfQuery}`}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Download PDF
          </a>
        </div>
      </section>

      {/* Attendance records */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <h2 className="font-semibold text-slate-900">Attendance Records</h2>

          <p className="mt-1 text-sm text-slate-600">
            Attendance records matching the selected filters.
          </p>
        </div>

        {records.length === 0 ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-xl font-bold">A</span>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No attendance records found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              No attendance records match the selected filters.
            </p>

            {hasFilters && (
              <Link
                href={`/school/classes/${classId}/attendance/history`}
                className="mt-5 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear Filters
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Date
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Admission Number
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Student
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Status
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Notes
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-700">
                      {record.date}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {record.admissionNumber}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/school/students/${record.id}`}
                        className="font-semibold text-slate-900 transition hover:text-blue-600"
                      >
                        {record.studentName}
                      </Link>
                    </td>

                    <td className="px-5 py-4">
                      {record.status === "PRESENT" && (
                        <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Present
                        </span>
                      )}

                      {record.status === "ABSENT" && (
                        <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                          Absent
                        </span>
                      )}

                      {record.status === "LATE" && (
                        <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          Late
                        </span>
                      )}

                      {record.status === "EXCUSED" && (
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          Excused
                        </span>
                      )}
                    </td>

                    <td className="max-w-sm px-5 py-4 text-slate-600">
                      {record.notes || "—"}
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
