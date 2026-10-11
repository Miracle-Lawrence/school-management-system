import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import TeacherGradebookTable from "./teacher-gradebook-table";

type GradebookEntryPageProps = {
  searchParams: Promise<{
    classId?: string;
    subjectId?: string;
    termId?: string;
    reportType?: string;
  }>;
};

function parsePositiveInteger(value?: string): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

export default async function TeacherGradebookEntryPage({
  searchParams,
}: GradebookEntryPageProps) {
  const session = await requireRole(["TEACHER"]);
  const schoolId = session.user.schoolId;
  const userId = Number(session.user.id);

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const params = await searchParams;

  const classId = parsePositiveInteger(params.classId);
  const subjectId = parsePositiveInteger(params.subjectId);
  const termId = parsePositiveInteger(params.termId);
  const reportType = params.reportType;

  if (
    !classId ||
    !subjectId ||
    !termId ||
    (reportType !== "MID_TERM" && reportType !== "TERMINAL")
  ) {
    notFound();
  }

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

  // Recheck the teacher's assignment on the server.
  const assignments = await db.orm.public.TeacherAssignment.where((item) =>
    item.teacherId.eq(teacher.id),
  ).all();

  const isAssigned = assignments.some(
    (assignment) =>
      assignment.schoolId === schoolId &&
      assignment.classId === classId &&
      assignment.subjectId === subjectId,
  );

  if (!isAssigned) {
    notFound();
  }

  const [
    schoolClass,
    subject,
    allTerms,
    sessions,
    configurations,
    allAssessments,
    allStudents,
    allScores,
    classSubjects,
  ] = await Promise.all([
    db.orm.public.SchoolClass.where((item) => item.id.eq(classId)).first(),
    db.orm.public.Subject.where((item) => item.id.eq(subjectId)).first(),
    db.orm.public.Term.all(),
    db.orm.public.AcademicSession.where((item) =>
      item.schoolId.eq(schoolId),
    ).all(),
    db.orm.public.ReportConfiguration.where((item) =>
      item.schoolId.eq(schoolId),
    ).all(),
    db.orm.public.Assessment.where((item) => item.schoolId.eq(schoolId)).all(),
    db.orm.public.Student.where((item) => item.schoolId.eq(schoolId)).all(),
    db.orm.public.AssessmentScore.all(),
    db.orm.public.ClassSubject.where((item) => item.classId.eq(classId)).all(),
  ]);

  if (
    !schoolClass ||
    schoolClass.schoolId !== schoolId ||
    !subject ||
    subject.schoolId !== schoolId
  ) {
    notFound();
  }

  const term = allTerms.find((item) => item.id === termId);

  const sessionRecord = term
    ? sessions.find((item) => item.id === term.sessionId)
    : undefined;

  if (!term || !sessionRecord) {
    notFound();
  }

  const classHasSubject = classSubjects.some(
    (item) => item.schoolId === schoolId && item.subjectId === subjectId,
  );

  if (!classHasSubject) {
    notFound();
  }

  const configuration = configurations.find(
    (item) => item.reportType === reportType && item.isActive,
  );

  if (!configuration) {
    return (
      <main className="space-y-4">
        <Link
          href="/teacher/gradebook"
          className="text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          ← Back to gradebook
        </Link>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          No active {reportType === "MID_TERM" ? "mid-term" : "terminal"} report
          configuration exists. Please contact your school administrator.
        </div>
      </main>
    );
  }

  const assessments = allAssessments
    .filter(
      (assessment) =>
        assessment.schoolId === schoolId &&
        assessment.classId === classId &&
        assessment.subjectId === subjectId &&
        assessment.termId === termId,
    )
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date.toString()).getTime() : 0;
      const dateB = b.date ? new Date(b.date.toString()).getTime() : 0;

      return (
        dateA - dateB ||
        a.type.localeCompare(b.type) ||
        a.title.localeCompare(b.title)
      );
    });

  const students = allStudents
    .filter(
      (student) =>
        student.schoolId === schoolId &&
        student.classId === classId &&
        student.isActive,
    )
    .sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName) ||
        a.firstName.localeCompare(b.firstName),
    );

  const assessmentIds = new Set(assessments.map((item) => item.id));

  const existingScores = allScores
    .filter((score) => assessmentIds.has(score.assessmentId))
    .filter((score) =>
      students.some((student) => student.id === score.studentId),
    );

  const markedStudentIds = new Set(
    existingScores.map((score) => score.studentId),
  );

  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  return (
    <main className="space-y-6">
      <Link
        href="/teacher/gradebook"
        className="inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-900"
      >
        ← Back to gradebook
      </Link>

      <section className="rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-900 p-6 text-white sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-200">
          Teacher gradebook
        </p>

        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          {schoolClass.name} · {subject.name}
        </h1>

        <p className="mt-2 text-blue-100">
          {term.name} · {sessionRecord.name}
        </p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-lg bg-white/10 px-3 py-2">
            Report: {reportType === "MID_TERM" ? "Mid-term" : "Terminal"}
          </span>

          <span className="rounded-lg bg-white/10 px-3 py-2">
            Assessments: {assessments.length}
          </span>

          <span className="rounded-lg bg-white/10 px-3 py-2">
            Active students: {students.length}
          </span>

          <span className="rounded-lg bg-white/10 px-3 py-2">
            Students with scores: {markedStudentIds.size}/{students.length}
          </span>
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Assessment gradebook
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Enter scores for your assigned class and subject. Existing scores
            are loaded automatically, and you can save multiple student scores
            together.
          </p>
        </div>

        {assessments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
            <h3 className="font-semibold text-slate-900">
              No assessments configured
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ask your school administrator to create assessments for this
              class, subject, and term before entering scores.
            </p>
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
            There are no active students in this class.
          </div>
        ) : (
          <TeacherGradebookTable
            classId={classId}
            subjectId={subjectId}
            termId={termId}
            assessments={assessments.map((assessment) => ({
              id: assessment.id,
              title: assessment.title,
              type: assessment.type,
              maxScore: assessment.maxScore,
            }))}
            students={students.map((student) => ({
              id: student.id,
              firstName: student.firstName,
              middleName: student.middleName,
              lastName: student.lastName,
              admissionNumber: student.admissionNumber,
            }))}
            existingScores={existingScores.map((score) => ({
              assessmentId: score.assessmentId,
              studentId: score.studentId,
              score: score.score,
            }))}
          />
        )}
      </section>

      
    </main>
  );
}
