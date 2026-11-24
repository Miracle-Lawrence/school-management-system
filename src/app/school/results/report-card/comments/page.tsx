import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/prisma/db";
import { requireRole } from "@/lib/auth/authorization";
import { saveReportComment } from "@/lib/services/report-comment.service";
import { getStudentReportCardData } from "@/lib/services/report-card.service";
import { getReportConfigurations } from "@/lib/services/report-configuration.service";

type ReportType = "MID_TERM" | "TERMINAL";

type SearchParams = {
  sessionId?: string;
  termId?: string;
  classId?: string;
  reportType?: string;
  saved?: string;
  error?: string;
};

type ReportCommentsPageProps = {
  searchParams: Promise<SearchParams>;
};

function formatScore(value: number | null | undefined) {
  return value == null ? "—" : Number(value).toFixed(2);
}

export default async function ReportCommentsPage({
  searchParams,
}: ReportCommentsPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    redirect("/school/results");
  }

  const params = await searchParams;

  const reportType: ReportType =
    params.reportType === "MID_TERM" ? "MID_TERM" : "TERMINAL";

  const sessions = await db.orm.public.AcademicSession.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const requestedSessionId = Number(params.sessionId);
  const selectedSession =
    sessions.find((item) => item.id === requestedSessionId) ?? sessions[0];

  const terms = selectedSession
    ? await db.orm.public.Term.where((item) =>
        item.sessionId.eq(selectedSession.id),
      ).all()
    : [];

  const requestedTermId = Number(params.termId);
  const selectedTerm =
    terms.find((item) => item.id === requestedTermId) ?? terms[0];

  const classes = await db.orm.public.SchoolClass.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const requestedClassId = Number(params.classId);
  const selectedClass =
    classes.find((item) => item.id === requestedClassId) ?? classes[0];

  const students = selectedClass
    ? await db.orm.public.Student.where((item) =>
        item.schoolId.eq(schoolId),
      ).all()
    : [];

  const classStudents = students
    .filter((student) => student.classId === selectedClass?.id)
    .sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName) ||
        a.firstName.localeCompare(b.firstName),
    );

  const configurations = (await getReportConfigurations(schoolId))
    .filter(
      (configuration) =>
        configuration.isActive && configuration.reportType === reportType,
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const selectedConfiguration = configurations[0];

  const studentReports = selectedClass && selectedTerm && selectedConfiguration
    ? await Promise.all(
        classStudents.map(async (student) => {
          try {
            const report = await getStudentReportCardData(
              schoolId,
              student.id,
              selectedClass.id,
              selectedTerm.id,
              reportType,
              selectedConfiguration.id,
            );

            return { student, report, reportError: null as string | null };
          } catch (error) {
            return {
              student,
              report: null,
              reportError:
                error instanceof Error
                  ? error.message
                  : "Unable to load this student's report.",
            };
          }
        }),
      )
    : classStudents.map((student) => ({
        student,
        report: null,
        reportError: selectedConfiguration
          ? "Select a valid session, term, and class."
          : `No active ${reportType === "MID_TERM" ? "mid-term" : "terminal"} report configuration is available.`,
      }));

  async function saveComments(formData: FormData) {
    "use server";

    const currentSession = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
    const currentSchoolId = currentSession.user.schoolId;

    if (!currentSchoolId) {
      redirect("/school/results");
    }

    const sessionId = Number(formData.get("sessionId"));
    const termId = Number(formData.get("termId"));
    const classId = Number(formData.get("classId"));
    const submittedReportType = String(formData.get("reportType") ?? "");

    const safeReportType: ReportType =
      submittedReportType === "MID_TERM"
        ? "MID_TERM"
        : submittedReportType === "TERMINAL"
          ? "TERMINAL"
          : "TERMINAL";

    const query = new URLSearchParams({
      sessionId: String(sessionId),
      termId: String(termId),
      classId: String(classId),
      reportType: safeReportType,
    });

    const returnToPage = (extra: Record<string, string>) => {
      const nextQuery = new URLSearchParams(query);
      for (const [key, value] of Object.entries(extra)) {
        nextQuery.set(key, value);
      }
      redirect(
        `/school/results/report-card/comments?${nextQuery.toString()}`,
      );
    };

    if (
      !Number.isInteger(sessionId) ||
      sessionId <= 0 ||
      !Number.isInteger(termId) ||
      termId <= 0 ||
      !Number.isInteger(classId) ||
      classId <= 0 ||
      !["MID_TERM", "TERMINAL"].includes(submittedReportType)
    ) {
      returnToPage({ error: "Invalid report selection. Please select the session, term, class, and report type again." });
    }

    const [schoolSessions, schoolTerms, schoolClasses, schoolStudents] =
      await Promise.all([
        db.orm.public.AcademicSession.where((item) =>
          item.schoolId.eq(currentSchoolId),
        ).all(),
        db.orm.public.Term.where((item) => item.id.eq(termId)).all(),
        db.orm.public.SchoolClass.where((item) =>
          item.schoolId.eq(currentSchoolId),
        ).all(),
        db.orm.public.Student.where((item) =>
          item.schoolId.eq(currentSchoolId),
        ).all(),
      ]);

    const validSession = schoolSessions.some(
      (item) => item.id === sessionId,
    );
    const validTerm = schoolTerms.some(
      (item) => item.id === termId && item.sessionId === sessionId,
    );
    const validClass = schoolClasses.some((item) => item.id === classId);

    if (!validSession || !validTerm || !validClass) {
      returnToPage({ error: "The selected session, term, or class is invalid." });
    }

    const eligibleStudents = schoolStudents
      .filter((student) => student.classId === classId)
      .sort((a, b) => a.id - b.id);

    const updates = eligibleStudents
      .map((student) => {
        const clearComment =
          formData.get(`clearPrincipalComment_${student.id}`) === "on";

        const comment = String(
          formData.get(`principalComment_${student.id}`) ?? "",
        ).trim();

        return {
          studentId: student.id,
          clearComment,
          comment,
        };
      })
      .filter((item) => item.clearComment || item.comment.length > 0);

    const tooLong = updates.find((item) => item.comment.length > 1000);
    if (tooLong) {
      returnToPage({
        error: "A principal comment exceeds the 1000-character limit. Shorten it and try again.",
      });
    }

    let savedCount = 0;

    try {
      for (const update of updates) {
        await saveReportComment(currentSchoolId, {
          studentId: update.studentId,
          termId,
          reportType: safeReportType,
          principalComment: update.clearComment ? "" : update.comment,
        });
        savedCount++;
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save the principal comments.";

      returnToPage({
        error: `${message}${savedCount > 0 ? ` ${savedCount} comment(s) were saved before the error.` : ""}`,
      });
    }

    returnToPage({ saved: String(savedCount) });
  }

  const reportCardHref =
    selectedSession && selectedTerm && selectedClass && selectedConfiguration
      ? `/school/results/report-card?${new URLSearchParams({
          sessionId: String(selectedSession.id),
          termId: String(selectedTerm.id),
          classId: String(selectedClass.id),
          configurationId: String(selectedConfiguration.id),
        }).toString()}`
      : "/school/results/report-card";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Principal's Report Comments
          </h1>
          <p className="text-sm text-muted-foreground">
            Review each student's report and enter principal or head teacher
            comments for the entire class. Teachers enter their own comments
            through the teacher portal.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={reportCardHref}
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            View Report Card
          </Link>
          <Link
            href="/school/results"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Back to Results
          </Link>
        </div>
      </div>

      {params.saved !== undefined && (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          {Number(params.saved) > 0
            ? `${params.saved} principal comment(s) saved successfully.`
            : "There were no comment changes to save."}
        </div>
      )}

      {params.error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {params.error}
        </div>
      )}

      <form method="GET" className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label htmlFor="sessionId" className="text-sm font-medium">
              Academic Session
            </label>
            <select
              id="sessionId"
              name="sessionId"
              defaultValue={selectedSession?.id ?? ""}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {sessions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="termId" className="text-sm font-medium">
              Term
            </label>
            <select
              id="termId"
              name="termId"
              defaultValue={selectedTerm?.id ?? ""}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {terms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="classId" className="text-sm font-medium">
              Class
            </label>
            <select
              id="classId"
              name="classId"
              defaultValue={selectedClass?.id ?? ""}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="reportType" className="text-sm font-medium">
              Report Type
            </label>
            <select
              id="reportType"
              name="reportType"
              defaultValue={reportType}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="MID_TERM">Mid-Term Report</option>
              <option value="TERMINAL">Terminal Report</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Load Class Reports
          </button>
        </div>
      </form>

      {!selectedSession || !selectedTerm || !selectedClass ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">Select an academic session, term, and class.</p>
        </div>
      ) : !selectedConfiguration ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">
            No active {reportType === "MID_TERM" ? "mid-term" : "terminal"} report configuration.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Activate a matching report configuration before reviewing student reports.
          </p>
        </div>
      ) : classStudents.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No students were found in this class.</p>
        </div>
      ) : (
        <form
          action={saveComments}
          className="space-y-5"
        >
          <input type="hidden" name="sessionId" value={selectedSession.id} />
          <input type="hidden" name="termId" value={selectedTerm.id} />
          <input type="hidden" name="classId" value={selectedClass.id} />
          <input type="hidden" name="reportType" value={reportType} />

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {selectedClass.name} — {selectedTerm.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedSession.name} · {reportType === "MID_TERM" ? "Mid-Term Report" : "Terminal Report"} · {classStudents.length} student(s)
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Configuration: {selectedConfiguration.name}
            </p>
          </div>

          {studentReports.map(({ student, report, reportError }, index) => (
            <section
              key={student.id}
              className="overflow-hidden rounded-lg border bg-card shadow-sm"
            >
              <div className="border-b px-5 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {index + 1}. {student.firstName} {student.middleName ? `${student.middleName} ` : ""}{student.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {student.admissionNumber} · {selectedClass.name}
                    </p>
                  </div>
                  {report && (
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                        report.academic.isComplete
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {report.academic.isComplete ? "Report complete" : "In progress"}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-2">
                <div className="min-w-0 space-y-3">
                  <h4 className="font-medium">Student's Report</h4>

                  {report ? (
                    <>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-md bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-semibold tabular-nums">
                            {formatScore(report.academic.totalScore)}
                          </p>
                        </div>
                        <div className="rounded-md bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">Average</p>
                          <p className="font-semibold tabular-nums">
                            {formatScore(report.academic.averageScore)}
                          </p>
                        </div>
                        <div className="rounded-md bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">Grade</p>
                          <p className="font-semibold">
                            {report.academic.grade ?? "—"}
                          </p>
                        </div>
                        <div className="rounded-md bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">Position</p>
                          <p className="font-semibold">
                            {report.academic.position == null
                              ? "—"
                              : `${report.academic.position}${report.academic.classSize ? ` / ${report.academic.classSize}` : ""}`}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-md border">
                        <table className="w-full min-w-[440px] text-left text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-3 py-2 font-medium">Subject</th>
                              <th className="px-3 py-2 font-medium">Components</th>
                              <th className="px-3 py-2 text-right font-medium">Total</th>
                              <th className="px-3 py-2 text-right font-medium">Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.academic.subjects.map((subject) => (
                              <tr key={subject.subjectId} className="border-t">
                                <td className="px-3 py-2 font-medium">
                                  {subject.subjectName}
                                </td>
                                <td className="px-3 py-2">
                                  {subject.components.length > 0 ? (
                                    <div className="space-y-1">
                                      {subject.components.map((component) => (
                                        <div
                                          key={component.componentId}
                                          className="text-xs text-muted-foreground"
                                        >
                                          {component.componentName}: {formatScore(component.score)} / {formatScore(component.maxScore)}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">No component scores</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                  {formatScore(subject.totalScore)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {subject.grade ?? "—"}
                                </td>
                              </tr>
                            ))}
                            {report.academic.subjects.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-3 py-5 text-center text-muted-foreground">
                                  No subject results available.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {report.academic.remark && (
                        <p className="text-sm">
                          <span className="font-medium">Overall remark:</span>{" "}
                          {report.academic.remark}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      {reportError ?? "The report could not be loaded."}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label
                      htmlFor={`principalComment_${student.id}`}
                      className="font-medium"
                    >
                      Principal / Head Teacher's Comment
                    </label>
                    <p className="text-xs text-muted-foreground">
                      This comment is saved specifically for this student, term, and report type.
                    </p>
                  </div>

                  <textarea
                    id={`principalComment_${student.id}`}
                    name={`principalComment_${student.id}`}
                    defaultValue={report?.comments.principalComment ?? ""}
                    rows={5}
                    maxLength={1000}
                    placeholder="Enter the principal or head teacher's official comment."
                    className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />

                  <label className="flex items-start gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      name={`clearPrincipalComment_${student.id}`}
                      className="mt-0.5"
                    />
                    Clear this student's existing principal comment
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Maximum 1000 characters. An empty field leaves an existing comment unchanged unless the clear option is checked.
                  </p>
                </div>
              </div>
            </section>
          ))}

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Save all entered comments for this class together.
            </p>
            <button
              type="submit"
              className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Save All Principal Comments
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
