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
    configurationId?: string;
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
  const configurationId = parsePositiveInteger(params.configurationId);

  if (!classId || !subjectId || !termId || !configurationId) {
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

  // Use the exact configuration selected by the teacher.
  const configuration = configurations.find(
    (item) => item.id === configurationId && item.isActive,
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
          The selected report configuration is unavailable or inactive. Please
          return to the gradebook and select an active configuration.
        </div>
      </main>
    );
  }

  // Load the assessment fields defined by this configuration.
  const reportComponents = await db.orm.public.ReportComponent.where((item) =>
    item.configurationId.eq(configuration.id),
  ).all();

  const assessmentComponents = reportComponents
    .filter(
      (component) =>
        component.type === "ASSESSMENT" &&
        component.isVisible &&
        component.assessmentType !== null,
    )
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const classAssessments = allAssessments
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

  /*
   * Map each visible configured field to assessments with the exact
   * assessment type and category. If multiple assessments match a field,
   * include each one instead of arbitrarily choosing one.
   */
  const configuredAssessments = assessmentComponents.flatMap((component) => {
    const matchingAssessments = classAssessments.filter(
      (assessment) =>
        assessment.type === component.assessmentType &&
        (assessment.assessmentCategoryId ?? null) ===
          (component.assessmentCategoryId ?? null),
    );

    return matchingAssessments.map((assessment) => ({
      id: assessment.id,
      title:
        matchingAssessments.length > 1
          ? `${component.name} — ${assessment.title}`
          : component.name,
      type: assessment.type,
      maxScore: assessment.maxScore,
      componentName: component.name,
      assessmentTitle: assessment.title,
    }));
  });

  const missingComponents = assessmentComponents.filter(
    (component) =>
      !classAssessments.some(
        (assessment) =>
          assessment.type === component.assessmentType &&
          (assessment.assessmentCategoryId ?? null) ===
            (component.assessmentCategoryId ?? null),
      ),
  );

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

  const assessmentIds = new Set(
    configuredAssessments.map((assessment) => assessment.id),
  );

  const studentIds = new Set(students.map((student) => student.id));

  const existingScores = allScores
    .filter((score) => assessmentIds.has(score.assessmentId))
    .filter((score) => studentIds.has(score.studentId));

  const markedStudentIds = new Set(
    existingScores.map((score) => score.studentId),
  );

  const reportLabel =
    configuration.reportType === "MID_TERM" ? "Mid-term" : "Terminal";

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
            Configuration: {configuration.name}
          </span>

          <span className="rounded-lg bg-white/10 px-3 py-2">
            Report: {reportLabel}
          </span>

          <span className="rounded-lg bg-white/10 px-3 py-2">
            Configured assessment fields: {assessmentComponents.length}
          </span>

          <span className="rounded-lg bg-white/10 px-3 py-2">
            Score columns: {configuredAssessments.length}
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
            {configuration.name} score entry
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Enter scores across the configured assessment fields for all active
            students, then save them together. Existing scores are loaded
            automatically. Leaving a score blank will not erase a previously
            saved score.
          </p>
        </div>

        {missingComponents.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <h3 className="font-semibold">
              Some configured fields have no matching assessments
            </h3>

            <p className="mt-1 text-sm leading-6">
              Ask your school administrator to create the corresponding
              assessments for this class, subject, and term. These fields cannot
              accept scores until matching assessments exist.
            </p>

            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {missingComponents.map((component) => (
                <li key={component.id}>{component.name}</li>
              ))}
            </ul>
          </div>
        )}

        {configuredAssessments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
            <h3 className="font-semibold text-slate-900">
              No matching assessment fields are ready for entry
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Check that this report configuration has visible assessment
              components and that matching assessments exist for the selected
              class, subject, and term.
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
            configurationId={configuration.id}
            assessments={configuredAssessments.map((assessment) => ({
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
