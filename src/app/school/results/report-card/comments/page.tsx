import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/prisma/db";
import { requireRole } from "@/lib/auth/authorization";
import {
  getReportComment,
  saveReportComment,
} from "@/lib/services/report-comment.service";

type SearchParams = {
  sessionId?: string;
  termId?: string;
  classId?: string;
  studentId?: string;
  saved?: string;
  error?: string;
};

type ReportCommentsPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ReportCommentsPage({
  searchParams,
}: ReportCommentsPageProps) {
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

  let existingComment = null;

  if (selectedStudent && selectedTermId) {
    existingComment = await getReportComment(
      schoolId,
      selectedStudent.id,
      selectedTermId,
      "TERMINAL",
    );
  }

  async function saveComments(formData: FormData) {
    "use server";

    const currentSession = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const currentSchoolId = currentSession.user.schoolId;

    if (!currentSchoolId) {
      redirect("/school/results");
    }

    const studentId = Number(formData.get("studentId"));
    const termId = Number(formData.get("termId"));

    const teacherComment = String(formData.get("teacherComment") ?? "");

    const principalComment = String(formData.get("principalComment") ?? "");

    try {
      await saveReportComment(currentSchoolId, {
        studentId,
        termId,
        reportType: "TERMINAL",
        teacherComment,
        principalComment,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save report comments.";

      redirect(
        `/school/results/report-card/comments?sessionId=${selectedSessionId}&termId=${termId}&classId=${selectedClassId}&studentId=${studentId}&error=${encodeURIComponent(message)}`,
      );
    }

    redirect(
      `/school/results/report-card/comments?sessionId=${selectedSessionId}&termId=${termId}&classId=${selectedClassId}&studentId=${studentId}&saved=1`,
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Comments</h1>

          <p className="text-sm text-muted-foreground">
            Enter teacher and principal comments for a student's terminal
            report.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/school/results/report-card"
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

      {/* Success / Error Messages */}
      {params.saved === "1" && (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          Report comments saved successfully.
        </div>
      )}

      {params.error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {params.error}
        </div>
      )}

      {/* Selector */}
      <form method="GET" className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Session */}
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
              key={`student-selector-${selectedStudentId}`}
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
            Load Student
          </button>
        </div>
      </form>

      {/* Comment Form */}
      {selectedStudent && selectedTermId ? (
        <form
          key={`comment-form-${selectedStudent.id}-${selectedTermId}`}
          action={saveComments}
          className="rounded-lg border bg-card shadow-sm"
        >
          <input type="hidden" name="studentId" value={selectedStudent.id} />

          <input type="hidden" name="termId" value={selectedTermId} />

          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold">
              {selectedStudent.firstName} {selectedStudent.lastName}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {selectedStudent.admissionNumber} ·{" "}
              {
                classes.find(
                  (schoolClass) => schoolClass.id === selectedClassId,
                )?.name
              }{" "}
              · {terms.find((term) => term.id === selectedTermId)?.name}
            </p>
          </div>

          <div className="space-y-6 p-6">
            {/* Teacher Comment */}
            <div className="space-y-2">
              <label htmlFor="teacherComment" className="text-sm font-medium">
                Teacher's Comment
              </label>

              <textarea
                key={`teacher-comment-${selectedStudent.id}-${selectedTermId}`}
                id="teacherComment"
                name="teacherComment"
                defaultValue={existingComment?.teacherComment ?? ""}
                rows={5}
                maxLength={1000}
                placeholder="Enter the teacher's comment about the student's academic performance, conduct, strengths, and areas for improvement."
                className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />

              <p className="text-xs text-muted-foreground">
                Maximum 1000 characters.
              </p>
            </div>

            {/* Principal Comment */}
            <div className="space-y-2">
              <label htmlFor="principalComment" className="text-sm font-medium">
                Principal / Head Teacher's Comment
              </label>

              <textarea
                key={`principal-comment-${selectedStudent.id}-${selectedTermId}`}
                id="principalComment"
                name="principalComment"
                defaultValue={existingComment?.principalComment ?? ""}
                rows={5}
                maxLength={1000}
                placeholder="Enter the principal or head teacher's official comment."
                className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />

              <p className="text-xs text-muted-foreground">
                Maximum 1000 characters.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
            <Link
              href={`/school/results/report-card?sessionId=${selectedSessionId}&termId=${selectedTermId}&classId=${selectedClassId}&studentId=${selectedStudent.id}`}
              className="rounded-md border px-5 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Save Comments
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">Select a valid student and term.</p>

          <p className="mt-1 text-sm text-muted-foreground">
            The student's report comments will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
