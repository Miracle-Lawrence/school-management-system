import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import AssessmentForm from "./assessment-form";

export default async function NewAssessmentPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const classes = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.schoolId.eq(schoolId),
  ).all();

  const subjects = await db.orm.public.Subject.where((subject) =>
    subject.schoolId.eq(schoolId),
  ).all();

  const assignments = await db.orm.public.ClassSubject.where((assignment) =>
    assignment.schoolId.eq(schoolId),
  ).all();

  const activeSessions = await db.orm.public.AcademicSession.where(
    (academicSession) => academicSession.schoolId.eq(schoolId),
  ).all();

  const currentSessions = activeSessions.filter(
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

  if (classOptions.length === 0) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      <div className="space-y-2">
        <Link
          href="/school/assessments"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to Assessments
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Create Assessment
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Set up an assignment, test, continuous assessment, or examination.
          </p>
        </div>
      </div>

      <AssessmentForm
        classes={classOptions}
        subjects={subjectOptions}
        assignments={assignmentOptions}
        terms={availableTerms}
      />
    </div>
  );
}
