import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import {
  getAssessmentById,
  getAssessmentScores,
} from "@/lib/services/assessment.service";
import AssessmentScoreEntry from "@/app/school/assessments/[id]/assessment-score-entry";

type TeacherAssessmentDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TeacherAssessmentDetailsPage({
  params,
}: TeacherAssessmentDetailsPageProps) {
  const session = await requireRole(["TEACHER"]);
  const schoolId = session.user.schoolId;
  const userId = Number(session.user.id);

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const assessmentId = Number(id);

  if (!Number.isSafeInteger(assessmentId) || assessmentId <= 0) {
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

  const assessment = await getAssessmentById(schoolId, assessmentId).catch(() =>
    notFound(),
  );

  const assignments = await db.orm.public.TeacherAssignment.where((item) =>
    item.teacherId.eq(teacher.id),
  ).all();

  const isAssigned = assignments.some(
    (assignment) =>
      assignment.schoolId === schoolId &&
      assignment.classId === assessment.classId &&
      assignment.subjectId === assessment.subjectId,
  );

  if (!isAssigned) {
    notFound();
  }

  const [schoolClass, subject, term, allStudents, scores] = await Promise.all([
    db.orm.public.SchoolClass.where((item) =>
      item.id.eq(assessment.classId),
    ).first(),

    db.orm.public.Subject.where((item) =>
      item.id.eq(assessment.subjectId),
    ).first(),

    db.orm.public.Term.where((item) => item.id.eq(assessment.termId)).first(),

    db.orm.public.Student.where((item) =>
      item.classId.eq(assessment.classId),
    ).all(),

    getAssessmentScores(schoolId, assessmentId),
  ]);

  if (
    !schoolClass ||
    schoolClass.schoolId !== schoolId ||
    !subject ||
    subject.schoolId !== schoolId ||
    !term
  ) {
    notFound();
  }

  const students = allStudents
    .filter(
      (student) =>
        student.schoolId === schoolId &&
        student.classId === assessment.classId &&
        student.isActive,
    )
    .map((student) => ({
      id: student.id,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      admissionNumber: student.admissionNumber,
    }));

  const existingScores = scores.map((score) => ({
    studentId: score.studentId,
    score: score.score,
    remarks: score.remarks,
  }));

  const markedStudents = students.filter((student) =>
    existingScores.some((score) => score.studentId === student.id),
  ).length;

  return (
    <main className="space-y-6">
      <Link
        href="/teacher/assessments"
        className="inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-900"
      >
        ← Back to assessments
      </Link>

      <section className="rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-900 p-6 text-white sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-200">
          Assessment score entry
        </p>

        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          {assessment.title}
        </h1>

        <p className="mt-2 text-blue-100">
          {schoolClass.name} · {subject.name}
        </p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-lg bg-white/10 px-3 py-2">
            Type: {assessment.type.replaceAll("_", " ")}
          </span>

          <span className="rounded-lg bg-white/10 px-3 py-2">
            Maximum score: {assessment.maxScore}
          </span>

          <span className="rounded-lg bg-white/10 px-3 py-2">
            Students marked: {markedStudents}/{students.length}
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">
          Enter student scores
        </h2>

        <p className="mb-6 text-sm leading-6 text-slate-600">
          Enter a score between 0 and {assessment.maxScore} for each student.
          Leave a score blank if it has not been recorded yet.
        </p>

        {students.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
            No active students are currently assigned to this class.
          </p>
        ) : (
          <AssessmentScoreEntry
            assessmentId={assessment.id}
            maxScore={assessment.maxScore}
            students={students}
            existingScores={existingScores}
          />
        )}
      </section>
    </main>
  );
}
