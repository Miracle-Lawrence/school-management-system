import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { db } from "@/prisma/db";
import { requireRole } from "@/lib/auth/authorization";
import { getClassTermResults } from "@/lib/services/result-calculation.service";
import { generateResultsAction } from "./actions";

type PageProps = {
  searchParams: Promise<{
    reportType?: string;
    sessionId?: string;
    classId?: string;
    termId?: string;
    status?: string;
    message?: string;
  }>;
};

function parsePositiveId(value?: string) {
  if (!value || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

function formatScore(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "—";
}

export default async function ResultsViewPage({ searchParams }: PageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const params = await searchParams;

  const reportType = params.reportType;
  const sessionId = parsePositiveId(params.sessionId);
  const classId = parsePositiveId(params.classId);
  const termId = parsePositiveId(params.termId);
  const status = params.status;
  const message = params.message;

  if (
    !reportType ||
    !["MID_TERM", "TERMINAL"].includes(reportType) ||
    !sessionId ||
    !classId ||
    !termId
  ) {
    redirect("/school/results");
  }

  const selectedReportType = reportType as "MID_TERM" | "TERMINAL";

  const [academicSession, schoolClass, term] = await Promise.all([
    db.orm.public.AcademicSession.where(
      (item) => item.id.eq(sessionId) && item.schoolId.eq(schoolId),
    ).first(),

    db.orm.public.SchoolClass.where(
      (item) => item.id.eq(classId) && item.schoolId.eq(schoolId),
    ).first(),

    db.orm.public.Term.where(
      (item) => item.id.eq(termId) && item.sessionId.eq(sessionId),
    ).first(),
  ]);

  if (!academicSession || !schoolClass || !term) {
    notFound();
  }

  const [students, savedResults] = await Promise.all([
    db.orm.public.Student.where(
      (item) => item.schoolId.eq(schoolId) && item.classId.eq(classId),
    ).all(),

    getClassTermResults(schoolId, classId, termId, selectedReportType),
  ]);

  const sortedStudents = [...students].sort((a, b) => {
    const nameA = `${a.lastName} ${a.firstName} ${a.middleName ?? ""}`;
    const nameB = `${b.lastName} ${b.firstName} ${b.middleName ?? ""}`;

    return nameA.localeCompare(nameB);
  });

  const resultByStudentId = new Map(
    savedResults.map((result) => [result.studentId, result]),
  );

  const completedCount = sortedStudents.filter((student) =>
    resultByStudentId.has(student.id),
  ).length;

  const pendingCount = sortedStudents.length - completedCount;

  const reportLabel =
    selectedReportType === "MID_TERM" ? "Mid-Term" : "Terminal";

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/school/results"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Results Management
          </Link>

          <h1 className="mt-3 text-2xl font-bold">Class Results</h1>

          <p className="mt-1 text-sm text-gray-500">
            Review saved student results for the selected reporting period.
          </p>

          {message && (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                status === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <p className="font-medium">
                {status === "success"
                  ? "Success"
                  : "Unable to generate results"}
              </p>

              <p className="mt-1">{message}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <form action={generateResultsAction}>
            <input type="hidden" name="reportType" value={selectedReportType} />
            <input type="hidden" name="sessionId" value={sessionId} />
            <input type="hidden" name="classId" value={classId} />
            <input type="hidden" name="termId" value={termId} />

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Generate Results
            </button>
          </form>

          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            {reportLabel}
          </span>
        </div>
      </div>

      <section className="grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm text-gray-500">Academic Session</p>
          <p className="mt-1 font-semibold">{academicSession.name}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Term</p>
          <p className="mt-1 font-semibold">{term.name}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Class</p>
          <p className="mt-1 font-semibold">{schoolClass.name}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Report Type</p>
          <p className="mt-1 font-semibold">{reportLabel}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="mt-2 text-3xl font-bold">{sortedStudents.length}</p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Results Generated</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {completedCount}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Pending Results</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {pendingCount}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b p-5">
          <h2 className="font-semibold">Student Results</h2>
          <p className="mt-1 text-sm text-gray-500">
            Results shown here are previously saved calculations.
          </p>
        </div>

        {sortedStudents.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="font-semibold">No students found</h3>
            <p className="mt-2 text-sm text-gray-500">
              There are currently no students assigned to this class.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">S/N</th>
                  <th className="px-4 py-3">Admission No.</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Total Score</th>
                  <th className="px-4 py-3">Average</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {sortedStudents.map((student, index) => {
                  const result = resultByStudentId.get(student.id);

                  const studentName = [
                    student.firstName,
                    student.middleName,
                    student.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{index + 1}</td>

                      <td className="px-4 py-3 font-medium">
                        {student.admissionNumber}
                      </td>

                      <td className="px-4 py-3">{studentName}</td>

                      <td className="px-4 py-3">
                        {result ? formatScore(result.totalScore) : "—"}
                      </td>

                      <td className="px-4 py-3">
                        {result ? formatScore(result.averageScore) : "—"}
                      </td>

                      <td className="px-4 py-3">{result?.grade ?? "—"}</td>

                      <td className="px-4 py-3">{result?.position ?? "—"}</td>

                      <td className="px-4 py-3">
                        {result ? (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                            Generated
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
