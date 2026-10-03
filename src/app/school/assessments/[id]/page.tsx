import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import {
  getAssessmentById,
  getAssessmentScores,
} from "@/lib/services/assessment.service";
import AssessmentScoreEntry from "./assessment-score-entry";
import { db } from "@/prisma/db";

type AssessmentDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AssessmentDetailsPage({
  params,
}: AssessmentDetailsPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const assessmentId = Number(id);

  if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
    notFound();
  }

  let assessment;

  try {
    assessment = await getAssessmentById(schoolId, assessmentId);
  } catch {
    notFound();
  }

  const [schoolClass, subject, term, students, scores] = await Promise.all([
    db.orm.public.SchoolClass.where((item) =>
      item.id.eq(assessment.classId),
    ).first(),

    db.orm.public.Subject.where((item) =>
      item.id.eq(assessment.subjectId),
    ).first(),

    db.orm.public.Term.where((item) => item.id.eq(assessment.termId)).first(),

    db.orm.public.Student.where((item) => item.classId.eq(assessment.classId))
      .all()
      .then((classStudents) =>
        classStudents.filter((student) => student.schoolId === schoolId),
      ),

    getAssessmentScores(schoolId, assessmentId),
  ]);

  const academicSession = term
    ? await db.orm.public.AcademicSession.where((item) =>
        item.id.eq(term.sessionId),
      ).first()
        : null;

    const totalStudents = students.length;
    const markedStudents = scores.length;
    const pendingStudents = Math.max(0, totalStudents - markedStudents);

    const completionPercentage =
      totalStudents > 0
        ? Math.round((markedStudents / totalStudents) * 100)
        : 0;

    const completionStatus =
      totalStudents === 0
        ? "No Students"
        : markedStudents === 0
          ? "Not Started"
          : markedStudents === totalStudents
            ? "Completed"
            : "In Progress";

  const formattedDate = assessment.date
    ? assessment.date.toString().slice(0, 10)
    : "Not specified";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      <div>
        <Link
          href="/school/assessments"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Back to Assessments
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {assessment.title}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Assessment details and academic information
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {assessment.type}
          </span>

          <Link
            href={`/school/assessments/${assessment.id}/edit`}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Edit Assessment
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Class</p>
          <p className="mt-1 font-semibold text-gray-900">
            {schoolClass?.name ?? "Unavailable"}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Subject</p>
          <p className="mt-1 font-semibold text-gray-900">
            {subject?.name ?? "Unavailable"}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Academic Session</p>
          <p className="mt-1 font-semibold text-gray-900">
            {academicSession?.name ?? "Unavailable"}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Term</p>
          <p className="mt-1 font-semibold text-gray-900">
            {term?.name ?? "Unavailable"}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Maximum Score</p>
          <p className="mt-1 font-semibold text-gray-900">
            {assessment.maxScore}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Weight</p>
          <p className="mt-1 font-semibold text-gray-900">
            {assessment.weight}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:col-span-2 lg:col-span-3">
          <p className="text-sm text-gray-500">Assessment Date</p>
          <p className="mt-1 font-semibold text-gray-900">{formattedDate}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {totalStudents}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Scores Entered</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {markedStudents}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">
            {pendingStudents}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Completion Status</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {completionStatus}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Score Entry Progress</h2>

          <span className="text-sm font-semibold text-blue-600">
            {completionPercentage}%
          </span>
        </div>

        <div
          className="h-3 w-full overflow-hidden rounded-full bg-gray-200"
          role="progressbar"
          aria-label="Score entry completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completionPercentage}
        >
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <p className="mt-2 text-sm text-gray-500">
          {markedStudents} of {totalStudents} students have scores recorded.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Description</h2>

        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
          {assessment.description || "No description provided."}
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <AssessmentScoreEntry
          assessmentId={assessment.id}
          maxScore={assessment.maxScore}
          students={students.map((student) => ({
            id: student.id,
            admissionNumber: student.admissionNumber,
            firstName: student.firstName,
            middleName: student.middleName,
            lastName: student.lastName,
          }))}
          existingScores={scores.map((score) => ({
            studentId: score.studentId,
            score: score.score,
            remarks: score.remarks,
          }))}
        />
      </div>
    </div>
  );
}
