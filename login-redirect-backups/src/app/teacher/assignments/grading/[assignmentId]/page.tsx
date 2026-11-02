import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { AssignmentGradingClient } from "./components/AssignmentGradingClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ assignmentId: string }>;
};

export default async function AssignmentGradingDetailPage({
  params,
}: PageProps) {
  const session = await requireRole(["TEACHER"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;
  const { assignmentId: assignmentIdParam } = await params;
  const assignmentId = Number(assignmentIdParam);

  if (!Number.isSafeInteger(userId) || userId <= 0 || !schoolId) {
    redirect("/login");
  }

  if (!Number.isSafeInteger(assignmentId) || assignmentId <= 0) {
    notFound();
  }

  const teacher = await db.orm.public.Teacher.where({ userId }).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    redirect("/teacher");
  }

  const assignment = await db.orm.public.Assignment.where({
    id: assignmentId,
    schoolId,
    teacherId: teacher.id,
  }).first();

  if (!assignment || !assignment.isPublished) {
    notFound();
  }

  const teacherAssignments =
    await db.orm.public.TeacherAssignment.where((item) =>
      item.teacherId.eq(teacher.id),
    ).all();

  const isAssignedToClassSubject = teacherAssignments.some(
    (item) =>
      item.schoolId === schoolId &&
      item.classId === assignment.classId &&
      item.subjectId === assignment.subjectId,
  );

  if (!isAssignedToClassSubject) {
    notFound();
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <Link
        href="/teacher/assignments/grading"
        className="inline-flex text-sm font-medium text-blue-700 hover:text-blue-900"
      >
        &larr; Back to Assignment Grading
      </Link>

      <AssignmentGradingClient
        assignment={{
          id: assignment.id,
          title: assignment.title,
          instructions: assignment.instructions,
          maxScore: assignment.maxScore,
          dueDate: assignment.dueDate,
          isPublished: assignment.isPublished,
        }}
      />
    </main>
  );
}
