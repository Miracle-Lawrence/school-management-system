import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import {
  getReportComment,
  saveReportComment,
} from "@/lib/services/report-comment.service";
import { db } from "@/prisma/db";

type ReportType = "MID_TERM" | "TERMINAL";

type TeacherReportCommentsPageProps = {
  searchParams: Promise<{
    classId?: string;
    termId?: string;
    reportType?: string;
    saved?: string;
    error?: string;
  }>;
};

function parsePositiveInteger(value?: string): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseReportType(value?: string): ReportType {
  return value === "MID_TERM" ? "MID_TERM" : "TERMINAL";
}

export default async function TeacherReportCommentsPage({
  searchParams,
}: TeacherReportCommentsPageProps) {
  const session = await requireRole(["TEACHER"]);
  const schoolId = session.user.schoolId;
  const userId = Number(session.user.id);
  const params = await searchParams;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const classId = parsePositiveInteger(params.classId);
  const termId = parsePositiveInteger(params.termId);
  const reportType = parseReportType(params.reportType);

  const teacher = await db.orm.public.Teacher.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Your teacher profile is not configured correctly. Please contact your
        school administrator.
      </main>
    );
  }

  const [allAssignments, schoolClasses, allTerms, sessions] = await Promise.all(
    [
      db.orm.public.TeacherAssignment.where((item) =>
        item.teacherId.eq(teacher.id),
      ).all(),
      db.orm.public.SchoolClass.where((item) =>
        item.schoolId.eq(schoolId),
      ).all(),
      db.orm.public.Term.all(),
      db.orm.public.AcademicSession.where((item) =>
        item.schoolId.eq(schoolId),
      ).all(),
    ],
  );

  const assignments = allAssignments.filter(
    (item) => item.schoolId === schoolId,
  );

  const assignedClassIds = new Set(assignments.map((item) => item.classId));

  const classes = schoolClasses
    .filter((item) => assignedClassIds.has(item.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const sessionIds = new Set(sessions.map((item) => item.id));

  const terms = allTerms
    .filter((item) => sessionIds.has(item.sessionId))
    .sort((a, b) => {
      const sessionA =
        sessions.find((record) => record.id === a.sessionId)?.name ?? "";

      const sessionB =
        sessions.find((record) => record.id === b.sessionId)?.name ?? "";

      return sessionB.localeCompare(sessionA) || a.name.localeCompare(b.name);
    });

  async function saveClassComments(formData: FormData) {
    "use server";

    const currentSession = await requireRole(["TEACHER"]);
    const currentSchoolId = currentSession.user.schoolId;
    const currentUserId = Number(currentSession.user.id);

    if (!currentSchoolId) {
      throw new Error("School context is required.");
    }

    const submittedClassId = parsePositiveInteger(
      String(formData.get("classId") ?? ""),
    );
    const submittedTermId = parsePositiveInteger(
      String(formData.get("termId") ?? ""),
    );
    const submittedReportType = parseReportType(
      String(formData.get("reportType") ?? ""),
    );

    if (!submittedClassId || !submittedTermId) {
      throw new Error("Select a valid class and academic term.");
    }

    const currentTeacher = await db.orm.public.Teacher.where((item) =>
      item.userId.eq(currentUserId),
    ).first();

    if (!currentTeacher || currentTeacher.schoolId !== currentSchoolId) {
      throw new Error("Your teacher profile could not be verified.");
    }

    const [
      currentAssignments,
      selectedClass,
      currentTerms,
      currentSessions,
      currentStudents,
    ] = await Promise.all([
      db.orm.public.TeacherAssignment.where((item) =>
        item.teacherId.eq(currentTeacher.id),
      ).all(),
      db.orm.public.SchoolClass.where((item) =>
        item.id.eq(submittedClassId),
      ).first(),
      db.orm.public.Term.all(),
      db.orm.public.AcademicSession.where((item) =>
        item.schoolId.eq(currentSchoolId),
      ).all(),
      db.orm.public.Student.where((item) =>
        item.schoolId.eq(currentSchoolId),
      ).all(),
    ]);

    const isAssigned = currentAssignments.some(
      (item) =>
        item.schoolId === currentSchoolId && item.classId === submittedClassId,
    );

    if (
      !isAssigned ||
      !selectedClass ||
      selectedClass.schoolId !== currentSchoolId
    ) {
      throw new Error("You are not assigned to this class.");
    }

    const validSessionIds = new Set(currentSessions.map((item) => item.id));

    const selectedTerm = currentTerms.find(
      (item) =>
        item.id === submittedTermId && validSessionIds.has(item.sessionId),
    );

    if (!selectedTerm) {
      throw new Error("The selected term does not belong to your school.");
    }

    const students = currentStudents
      .filter(
        (item) =>
          item.schoolId === currentSchoolId &&
          item.classId === submittedClassId &&
          item.isActive,
      )
      .sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName) ||
          a.firstName.localeCompare(b.firstName),
      );

    let savedCount = 0;

    for (const student of students) {
      const rawValue = formData.get(`teacherComment_${student.id}`);

      if (typeof rawValue !== "string") {
        continue;
      }

      const teacherComment = rawValue.trim();

      // Blank fields must never overwrite existing comments.
      if (!teacherComment) {
        continue;
      }

      if (teacherComment.length > 1000) {
        throw new Error(
          `The comment for ${student.firstName} ${student.lastName} exceeds 1000 characters.`,
        );
      }

      await saveReportComment(currentSchoolId, {
        studentId: student.id,
        termId: submittedTermId,
        reportType: submittedReportType,
        teacherComment,
      });

      savedCount += 1;
    }

    redirect(
      `/teacher/report-comments?classId=${submittedClassId}` +
        `&termId=${submittedTermId}` +
        `&reportType=${submittedReportType}` +
        `&saved=${savedCount}`,
    );
  }

  const selectedClass = classes.find((item) => item.id === classId);
  const selectedTerm = terms.find((item) => item.id === termId);

  const students =
    selectedClass && selectedTerm
      ? (
          await db.orm.public.Student.where((item) =>
            item.schoolId.eq(schoolId),
          ).all()
        )
          .filter(
            (item) =>
              item.schoolId === schoolId &&
              item.classId === selectedClass.id &&
              item.isActive,
          )
          .sort(
            (a, b) =>
              a.lastName.localeCompare(b.lastName) ||
              a.firstName.localeCompare(b.firstName),
          )
      : [];

  const existingComments =
    selectedClass && selectedTerm
      ? await Promise.all(
          students.map(async (student) => ({
            studentId: student.id,
            comment: await getReportComment(
              schoolId,
              student.id,
              selectedTerm.id,
              reportType,
            ),
          })),
        )
      : [];

  const commentsByStudent = new Map(
    existingComments.map((item) => [
      item.studentId,
      item.comment?.teacherComment ?? "",
    ]),
  );

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Teaching and Learning
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Teacher Report Comments
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Enter comments for every student in your assigned class in one place.
          Only nonblank comments are saved; leaving a field blank preserves any
          previously saved comment.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Select class and term
        </h2>

        <form
          method="GET"
          className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="text-sm font-medium text-slate-700">
            Assigned class
            <select
              name="classId"
              defaultValue={classId?.toString() ?? ""}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
            >
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Academic term
            <select
              name="termId"
              defaultValue={termId?.toString() ?? ""}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
            >
              <option value="">Select term</option>
              {terms.map((item) => {
                const academicSession = sessions.find(
                  (record) => record.id === item.sessionId,
                );

                return (
                  <option key={item.id} value={item.id}>
                    {item.name} — {academicSession?.name ?? "Academic session"}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Report type
            <select
              name="reportType"
              defaultValue={reportType}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
            >
              <option value="TERMINAL">Terminal report</option>
              <option value="MID_TERM">Mid-term report</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Load students
            </button>
          </div>
        </form>
      </section>

      {params.saved !== undefined && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Saved {Number(params.saved)} nonblank student comment(s). Blank fields
          were left unchanged.
        </div>
      )}

      {params.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Some comments could not be saved. Please review the entries and try
          again.
        </div>
      )}

      {selectedClass && selectedTerm ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedClass.name} — {selectedTerm.name}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {reportType === "MID_TERM" ? "Mid-term" : "Terminal"} report ·{" "}
              {students.length} active student(s)
            </p>
          </div>

          {students.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-600">
              No active students were found in this class.
            </div>
          ) : (
            <form action={saveClassComments}>
              <input type="hidden" name="classId" value={selectedClass.id} />
              <input type="hidden" name="termId" value={selectedTerm.id} />
              <input type="hidden" name="reportType" value={reportType} />

              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="w-16 px-4 py-3 font-semibold text-slate-600">
                        No.
                      </th>
                      <th className="w-64 px-4 py-3 font-semibold text-slate-600">
                        Student
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Teacher comment
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {students.map((student, index) => (
                      <tr key={student.id} className="align-top">
                        <td className="px-4 py-4 text-slate-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">
                            {student.lastName}, {student.firstName}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <textarea
                            name={`teacherComment_${student.id}`}
                            defaultValue={
                              commentsByStudent.get(student.id) ?? ""
                            }
                            rows={3}
                            maxLength={1000}
                            placeholder="Enter this student's teacher comment..."
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-xs leading-5 text-slate-600">
                  Blank comments are skipped. Existing teacher comments and
                  principal comments are preserved.
                </p>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Save class comments
                </button>
              </div>
            </form>
          )}
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <h2 className="font-semibold text-slate-800">
            Select a class and term
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Choose your assigned class, academic term, and report type above,
            then select Load students to enter comments for the whole class.
          </p>
        </div>
      )}

      <Link
        href="/teacher/dashboard"
        className="inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900"
      >
        ← Back to teacher dashboard
      </Link>
    </main>
  );
}
