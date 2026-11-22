import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import CBTQuestionBankManager from "@/components/cbt-question-bank-manager";

export default async function TeacherQuestionBanksPage() {
  const session = await requireRole(["TEACHER"]);
  const schoolId = session.user.schoolId;
  const userId = session.user.id;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const teacher = await db.orm.public.Teacher.where((record) =>
    record.userId.eq(userId),
  ).first();

  if (!teacher) {
    throw new Error("Teacher record not found.");
  }

  const assignments = await db.orm.public.TeacherAssignment.where(
    (assignment) => assignment.teacherId.eq(teacher.id),
  ).all();

  const assignedSubjectIds = new Set(
    assignments
      .filter((assignment) => assignment.schoolId === schoolId)
      .map((assignment) => assignment.subjectId),
  );

  const subjectRecords = await db.orm.public.Subject.where((subject) =>
    subject.schoolId.eq(schoolId),
  ).all();

  const subjects = subjectRecords
    .filter((subject) => assignedSubjectIds.has(subject.id))
    .map((subject) => ({
      id: subject.id,
      name: subject.name,
    }));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-2 sm:px-4">
      <div>
        <Link
          href="/teacher/assessments"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to Assessments
        </Link>

        <p className="mt-4 text-sm font-semibold text-blue-600">
          Teacher Portal
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          My CBT Question Banks
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Create and manage your question banks for the subjects assigned to
          you. Organize questions and reuse them when preparing CBT
          examinations.
        </p>
      </div>

      <CBTQuestionBankManager subjects={subjects} />
    </div>
  );
}
