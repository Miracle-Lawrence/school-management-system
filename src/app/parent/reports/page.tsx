import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export default async function ParentReportsPage() {
  const session = await requireRole(["PARENT"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (!schoolId || !Number.isSafeInteger(userId) || userId <= 0) {
    redirect("/login");
  }

  const user = await db.orm.public.User.where((item) =>
    item.id.eq(userId),
  ).first();

  if (!user || !user.isActive) {
    redirect("/login");
  }

  if (user.mustChangePassword) {
    redirect("/parent/change-password");
  }

  const parent = await db.orm.public.Parent.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!parent || parent.schoolId !== schoolId) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-6">
        <h1 className="text-2xl font-bold text-slate-900">
          My children's reports
        </h1>
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Your parent profile is not linked to your school account. Please
          contact your school administrator.
        </p>
      </main>
    );
  }

  const [links, publications, results, classes, terms] = await Promise.all([
    db.orm.public.ParentStudent.where((item) =>
      item.parentId.eq(parent.id),
    ).all(),

    db.orm.public.ReportPublication.where(
      (item) => item.schoolId.eq(schoolId) && item.isPublished.eq(true),
    ).all(),

    db.orm.public.StudentTermResult.where((item) =>
      item.schoolId.eq(schoolId),
    ).all(),

    db.orm.public.SchoolClass.where((item) => item.schoolId.eq(schoolId)).all(),

    db.orm.public.Term.all(),
  ]);

  const linkedStudentIds = new Set(links.map((link) => link.studentId));

  const students = await db.orm.public.Student.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const children = students.filter((student) =>
    linkedStudentIds.has(student.id),
  );

  const childById = new Map(children.map((student) => [student.id, student]));

  const classById = new Map(
    classes.map((schoolClass) => [schoolClass.id, schoolClass]),
  );

  const termById = new Map(terms.map((term) => [term.id, term]));

  const publishedReports = publications.flatMap((publication) => {
    const matchingResults = results.filter(
      (result) =>
        result.classId === publication.classId &&
        result.termId === publication.termId &&
        result.reportType === publication.reportType &&
        childById.has(result.studentId),
    );

    return matchingResults.map((result) => {
      const student = childById.get(result.studentId)!;

      return {
        key: `${student.id}-${publication.id}`,
        studentId: student.id,
        studentName: [student.firstName, student.middleName, student.lastName]
          .filter(Boolean)
          .join(" "),
        admissionNumber: student.admissionNumber,
        classId: publication.classId,
        className: classById.get(publication.classId)?.name ?? "Class",
        termId: publication.termId,
        termName: termById.get(publication.termId)?.name ?? "Term",
        reportType: publication.reportType,
        publishedAt: publication.publishedAt,
      };
    });
  });

  publishedReports.sort((a, b) => {
    const studentComparison = a.studentName.localeCompare(b.studentName);

    if (studentComparison !== 0) {
      return studentComparison;
    }

    return a.termName.localeCompare(b.termName);
  });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header>
        <p className="text-sm font-semibold text-blue-600">Family portal</p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          My children's reports
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          View reports released by your school for your linked children.
        </p>
      </header>

      {publishedReports.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">
            No published reports yet
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Reports will appear here when your school publishes them.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Term</th>
                  <th className="px-4 py-3">Report type</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {publishedReports.map((report) => (
                  <tr key={report.key} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {report.studentName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {report.admissionNumber}
                      </p>
                    </td>

                    <td className="px-4 py-3">{report.className}</td>
                    <td className="px-4 py-3">{report.termName}</td>
                    <td className="px-4 py-3">
                      {report.reportType === "MID_TERM"
                        ? "Mid-Term"
                        : "Terminal"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/parent/reports/view?studentId=${report.studentId}&classId=${report.classId}&termId=${report.termId}&reportType=${report.reportType}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        View report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
