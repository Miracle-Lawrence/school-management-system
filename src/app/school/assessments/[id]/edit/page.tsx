import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { getAssessmentById } from "@/lib/services/assessment.service";
import { db } from "@/prisma/db";

import AssessmentForm from "../../new/assessment-form";

type EditAssessmentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAssessmentPage({
  params,
}: EditAssessmentPageProps) {
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

  const [classes, subjects, assignments, academicSessions] = await Promise.all([
    db.orm.public.SchoolClass.where((schoolClass) =>
      schoolClass.schoolId.eq(schoolId),
    ).all(),

    db.orm.public.Subject.where((subject) =>
      subject.schoolId.eq(schoolId),
    ).all(),

    db.orm.public.ClassSubject.where((assignment) =>
      assignment.schoolId.eq(schoolId),
    ).all(),

    db.orm.public.AcademicSession.where((academicSession) =>
      academicSession.schoolId.eq(schoolId),
    ).all(),
  ]);

  const currentSessions = academicSessions.filter(
    (academicSession) => academicSession.isActive,
  );

  const termsBySession = await Promise.all(
    currentSessions.map(async (academicSession) => {
      const terms = await db.orm.public.Term.where((term) =>
        term.sessionId.eq(academicSession.id),
      ).all();

      return terms
        .filter((term) => term.isActive)
        .map((term) => ({
          id: term.id,
          name: term.name,
          sessionName: academicSession.name,
        }));
    }),
  );

  const availableTerms = termsBySession.flat();

  const classOptions = classes.map((schoolClass) => ({
    id: schoolClass.id,
    name: schoolClass.name,
  }));

  const subjectOptions = subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
  }));

  const assignmentOptions = assignments.map((assignment) => ({
    classId: assignment.classId,
    subjectId: assignment.subjectId,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      <div className="space-y-2">
        <Link
          href={`/school/assessments/${assessmentId}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to Assessment
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Edit Assessment
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update the assessment details below.
          </p>
        </div>
      </div>

      <AssessmentForm
        classes={classOptions}
        subjects={subjectOptions}
        assignments={assignmentOptions}
        terms={availableTerms}
        assessment={{
          id: assessment.id,
          classId: assessment.classId,
          subjectId: assessment.subjectId,
          termId: assessment.termId,
          title: assessment.title,
          type: assessment.type,
          maxScore: assessment.maxScore,
          weight: assessment.weight,
          date: assessment.date?.toString() ?? null,
          description: assessment.description,
        }}
      />
    </div>
  );
}
