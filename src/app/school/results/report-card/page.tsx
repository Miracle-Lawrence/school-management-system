import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/prisma/db";
import { requireRole } from "@/lib/auth/authorization";
import { getStudentReportCardData } from "@/lib/services/report-card.service";

type SearchParams = {
  sessionId?: string;
  termId?: string;
  classId?: string;
  studentId?: string;
};

type ReportCardPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ReportCardPage({
  searchParams,
}: ReportCardPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    redirect("/school/results");
  }

  const params = await searchParams;

  const sessions = await db.orm.public.AcademicSession.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const selectedSessionId = Number(params.sessionId) || sessions[0]?.id;

  const terms = selectedSessionId
    ? await db.orm.public.Term.where((item) =>
        item.sessionId.eq(selectedSessionId),
      ).all()
    : [];

  const selectedTermId = Number(params.termId) || terms[0]?.id;

  const classes = await db.orm.public.SchoolClass.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const selectedClassId = Number(params.classId) || classes[0]?.id;

  const students = selectedClassId
    ? await db.orm.public.Student.where((item) =>
        item.schoolId.eq(schoolId),
      ).all()
    : [];

  const classStudents = students
    .filter((student) => student.classId === selectedClassId)
    .sort((a, b) => a.lastName.localeCompare(b.lastName));

  const selectedStudentId = Number(params.studentId) || classStudents[0]?.id;

  const selectedStudent = classStudents.find(
    (student) => student.id === selectedStudentId,
  );

  let reportCardData = null;

  if (selectedStudent && selectedTermId && selectedClassId) {
    try {
      reportCardData = await getStudentReportCardData(
        schoolId,
        selectedStudent.id,
        selectedClassId,
        selectedTermId,
        "TERMINAL",
      );
    } catch {
      reportCardData = null;
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Cards</h1>

          <p className="text-sm text-muted-foreground">
            Select a student to load their report-card data.
          </p>
        </div>

        <Link
          href="/school/results"
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Back to Results
        </Link>
      </div>

      {/* Report Card Selector */}
      <form method="GET" className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Academic Session */}
          <div className="space-y-2">
            <label htmlFor="sessionId" className="text-sm font-medium">
              Academic Session
            </label>

            <select
              id="sessionId"
              name="sessionId"
              defaultValue={selectedSessionId ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {sessions.map((academicSession) => (
                <option key={academicSession.id} value={academicSession.id}>
                  {academicSession.name}
                </option>
              ))}
            </select>
          </div>

          {/* Term */}
          <div className="space-y-2">
            <label htmlFor="termId" className="text-sm font-medium">
              Term
            </label>

            <select
              id="termId"
              name="termId"
              defaultValue={selectedTermId ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div className="space-y-2">
            <label htmlFor="classId" className="text-sm font-medium">
              Class
            </label>

            <select
              id="classId"
              name="classId"
              defaultValue={selectedClassId ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
            </select>
          </div>

          {/* Student */}
          <div className="space-y-2">
            <label htmlFor="studentId" className="text-sm font-medium">
              Student
            </label>

            <select
              id="studentId"
              name="studentId"
              defaultValue={selectedStudentId ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {classStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Load Report Card
          </button>
        </div>
      </form>

      {/* Report Card Data */}
      {selectedStudent && selectedTermId && selectedClassId ? (
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Report Card Data</h2>

            {/* Student Information */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Student</p>

                <p className="font-medium">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Admission Number
                </p>

                <p className="font-medium">{selectedStudent.admissionNumber}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Class</p>

                <p className="font-medium">
                  {classes.find(
                    (schoolClass) => schoolClass.id === selectedClassId,
                  )?.name ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Term</p>

                <p className="font-medium">
                  {terms.find((term) => term.id === selectedTermId)?.name ??
                    "—"}
                </p>
              </div>
            </div>

            {reportCardData ? (
              <div className="mt-6 space-y-6">
                {/* Academic Summary */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-md border p-4">
                    <p className="text-xs text-muted-foreground">Total Score</p>

                    <p className="mt-1 text-xl font-bold">
                      {reportCardData.academic.totalScore}
                    </p>
                  </div>

                  <div className="rounded-md border p-4">
                    <p className="text-xs text-muted-foreground">Average</p>

                    <p className="mt-1 text-xl font-bold">
                      {reportCardData.academic.averageScore.toFixed(2)}
                    </p>
                  </div>

                  <div className="rounded-md border p-4">
                    <p className="text-xs text-muted-foreground">Grade</p>

                    <p className="mt-1 text-xl font-bold">
                      {reportCardData.academic.grade}
                    </p>
                  </div>

                  <div className="rounded-md border p-4">
                    <p className="text-xs text-muted-foreground">Position</p>

                    <p className="mt-1 text-xl font-bold">
                      {reportCardData.academic.position ?? "—"}
                    </p>
                  </div>

                  <div className="rounded-md border p-4">
                    <p className="text-xs text-muted-foreground">
                      Class Average
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {reportCardData.academic.classAverage?.toFixed(2) ?? "—"}
                    </p>
                  </div>
                </div>

                {/* Academic Results */}
                <div>
                  <h3 className="mb-3 text-base font-semibold">
                    Academic Results
                  </h3>

                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left">Subject</th>

                          {reportCardData.academic.subjects[0]?.components.map(
                            (component) => (
                              <th
                                key={component.componentId}
                                className="px-4 py-3 text-center"
                              >
                                {component.componentName}
                              </th>
                            ),
                          )}

                          <th className="px-4 py-3 text-center">Total</th>

                          <th className="px-4 py-3 text-center">Grade</th>

                          <th className="px-4 py-3 text-left">Remark</th>
                        </tr>
                      </thead>

                      <tbody>
                        {reportCardData.academic.subjects.map((subject) => (
                          <tr key={subject.subjectId} className="border-t">
                            <td className="px-4 py-3 font-medium">
                              {subject.subjectName}
                            </td>

                            {reportCardData.academic.subjects[0]?.components.map(
                              (component) => {
                                const score = subject.components.find(
                                  (item) =>
                                    item.componentId === component.componentId,
                                );

                                return (
                                  <td
                                    key={component.componentId}
                                    className="px-4 py-3 text-center"
                                  >
                                    {score
                                      ? `${score.score}/${score.maxScore}`
                                      : "—"}
                                  </td>
                                );
                              },
                            )}

                            <td className="px-4 py-3 text-center font-semibold">
                              {subject.totalScore}
                            </td>

                            <td className="px-4 py-3 text-center font-semibold">
                              {subject.grade}
                            </td>

                            <td className="px-4 py-3">{subject.remark}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Psychomotor Assessment */}
                <div>
                  <h3 className="mb-3 text-base font-semibold">
                    Psychomotor Assessment
                  </h3>

                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            Behaviour / Skill
                          </th>

                          <th className="px-4 py-3 text-center">Rating</th>

                          <th className="px-4 py-3 text-left">Comment</th>
                        </tr>
                      </thead>

                      <tbody>
                        {reportCardData.psychomotor.map((item) => (
                          <tr key={item.fieldId} className="border-t">
                            <td className="px-4 py-3 font-medium">
                              {item.fieldName}
                            </td>

                            <td className="px-4 py-3 text-center">
                              {item.ratingLabel
                                ? `${item.ratingLabel}${
                                    item.ratingValue
                                      ? ` (${item.ratingValue})`
                                      : ""
                                  }`
                                : "Not rated"}
                            </td>

                            <td className="px-4 py-3">{item.comment || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Report Comments */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-md border p-5">
                    <h3 className="mb-3 text-base font-semibold">
                      Teacher&apos;s Comment
                    </h3>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {reportCardData.comments.teacherComment || "—"}
                    </p>
                  </div>

                  <div className="rounded-md border p-5">
                    <h3 className="mb-3 text-base font-semibold">
                      Principal&apos;s Comment
                    </h3>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {reportCardData.comments.principalComment || "—"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-md border border-dashed p-6 text-center">
                <p className="font-medium">
                  Report card data is not available yet.
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Make sure all required academic results have been calculated
                  for this student and term.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Select a valid session, term, class, and student.
          </p>
        </div>
      )}
    </div>
  );
}
