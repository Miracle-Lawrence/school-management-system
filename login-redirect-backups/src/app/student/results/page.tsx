import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { redirect } from "next/navigation";
import StudentContentReadObserver from "../components/StudentContentReadObserver";

const reportTypes = [
  { value: "MID_TERM", label: "Mid-Term Report" },
  { value: "TERMINAL", label: "Terminal Report" },
] as const;

function formatScore(value: number | null | undefined) {
  return typeof value === "number" ? value.toFixed(1).replace(/\.0$/, "") : "—";
}

export default async function StudentResultsPage() {
  const session = await requireRole(["STUDENT"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (!Number.isInteger(userId) || !schoolId) {
    redirect("/login");
  }

  const student = await db.orm.public.Student.where(
    (item) => item.userId.eq(userId),
  ).first();

  if (
    !student ||
    !student.isActive ||
    student.schoolId !== schoolId
  ) {
    return (
      <main className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">My Results</h1>
          <p className="mt-1 text-sm text-slate-500">
            View your published academic results.
          </p>
        </header>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Your student profile is not linked to an active school record.
          Please contact your school administrator.
        </div>
      </main>
    );
  }

  if (!student.classId) {
    return (
      <main className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">My Results</h1>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          You have not been assigned to a class yet. Your results will be
          available here once your class is assigned and results are published.
        </div>
      </main>
    );
  }

  const publications = await db.orm.public.ReportPublication.where(
    (item) => item.schoolId.eq(schoolId),
  ).all();

  const publishedReports = publications.filter(
    (publication) =>
      publication.classId === student.classId &&
      publication.isPublished,
  );

  const reportSections = await Promise.all(
    publishedReports.map(async (publication) => {
      const term = await db.orm.public.Term.where(
        (item) => item.id.eq(publication.termId),
      ).first();

      const subjectResults = await db.orm.public.SubjectResult.where(
        (item) => item.studentId.eq(student.id),
      ).all();

      const matchingSubjectResults = subjectResults.filter(
        (result) =>
          result.schoolId === schoolId &&
          result.classId === student.classId &&
          result.termId === publication.termId &&
          result.reportType === publication.reportType,
      );

      const termResults = await db.orm.public.StudentTermResult.where(
        (item) => item.studentId.eq(student.id),
      ).all();

      const overallResult = termResults.find(
        (result) =>
          result.schoolId === schoolId &&
          result.classId === student.classId &&
          result.termId === publication.termId &&
          result.reportType === publication.reportType,
      );

      const subjects = await Promise.all(
        matchingSubjectResults.map(async (result) => {
          const subject = await db.orm.public.Subject.where(
            (item) => item.id.eq(result.subjectId),
          ).first();

          return {
            ...result,
            subjectName:
              subject && subject.schoolId === schoolId
                ? subject.name
                : "Subject",
          };
        }),
      );

      return {
        id: publication.id,
        termName: term?.name ?? "Academic Term",
        reportType: publication.reportType,
        reportLabel:
          reportTypes.find((type) => type.value === publication.reportType)
            ?.label ?? publication.reportType,
        subjects,
        overallResult,
      };
    }),
  );

  reportSections.sort((a, b) => b.id - a.id);

  const hasResults = reportSections.some(
    (section) =>
      section.subjects.length > 0 || section.overallResult !== undefined,
  );

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Results</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review your published scores and academic performance.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">Admission Number</p>
          <p className="mt-1 font-semibold text-slate-800">
            {student.admissionNumber}
          </p>
        </div>
      </header>

      {!hasResults ? (
        <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl text-blue-700">
            R
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No published results yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Your results will appear here after your school publishes them.
            Please check again later or contact your school if you have
            questions.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {reportSections.map((section) => {
            if (
              section.subjects.length === 0 &&
              !section.overallResult
            ) {
              return null;
            }

            return (
              <StudentContentReadObserver
                contentType="RESULT"
                contentId={section.id}
              >
                <section
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {section.termName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {section.reportLabel}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    Published
                  </span>
                </div>

                {section.overallResult && (
                  <div className="grid grid-cols-2 gap-3 border-b border-slate-200 p-5 md:grid-cols-4">
                    <div className="rounded-lg bg-blue-50 p-4">
                      <p className="text-xs text-slate-500">Total Score</p>
                      <p className="mt-2 text-xl font-bold text-blue-900">
                        {formatScore(section.overallResult.totalScore)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-indigo-50 p-4">
                      <p className="text-xs text-slate-500">Average</p>
                      <p className="mt-2 text-xl font-bold text-indigo-900">
                        {formatScore(section.overallResult.averageScore)}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-4">
                      <p className="text-xs text-slate-500">Grade</p>
                      <p className="mt-2 text-xl font-bold text-emerald-900">
                        {section.overallResult.grade || "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-4">
                      <p className="text-xs text-slate-500">Class Position</p>
                      <p className="mt-2 text-xl font-bold text-amber-900">
                        {section.overallResult.position ?? "—"}
                      </p>
                    </div>
                  </div>
                )}

                {section.subjects.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-sm">
                      <thead className="bg-white text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Subject</th>
                          <th className="px-5 py-3 font-semibold">Total Score</th>
                          <th className="px-5 py-3 font-semibold">Percentage</th>
                          <th className="px-5 py-3 font-semibold">Grade</th>
                          <th className="px-5 py-3 font-semibold">Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {section.subjects.map((result) => (
                          <tr key={result.id} className="hover:bg-slate-50">
                            <td className="px-5 py-4 font-medium text-slate-800">
                              {result.subjectName}
                            </td>
                            <td className="px-5 py-4 text-slate-700">
                              {formatScore(result.totalScore)}
                            </td>
                            <td className="px-5 py-4 text-slate-700">
                              {formatScore(result.percentageScore)}%
                            </td>
                            <td className="px-5 py-4">
                              <span className="rounded-md bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                                {result.grade || "—"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {result.remark || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {section.overallResult?.remark && (
                  <div className="border-t border-slate-200 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Overall Remark
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {section.overallResult.remark}
                    </p>
                  </div>
                )}
                </section>
              </StudentContentReadObserver>
            );
          })}
        </div>
      )}
    </main>
  );
}

