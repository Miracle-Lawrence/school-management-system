import { requireRole } from "@/lib/auth/authorization";
import { getTeacherAssignments } from "@/lib/services/assignment.service";
import { db } from "@/prisma/db";
import TeacherAssignmentsClient from "./components/TeacherAssignmentsClient";

export default async function TeacherAssignmentsPage() {
  const session = await requireRole(["TEACHER"]);
  const schoolId = session.user.schoolId;
  const userId = Number(session.user.id);

  if (!schoolId) {
    throw new Error("School context is required.");
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

  const [teacherAssignments, classes, subjects, assignments] =
    await Promise.all([
      db.orm.public.TeacherAssignment.where((item) =>
        item.teacherId.eq(teacher.id),
      ).all(),
      db.orm.public.SchoolClass.where((item) =>
        item.schoolId.eq(schoolId),
      ).all(),
      db.orm.public.Subject.where((item) =>
        item.schoolId.eq(schoolId),
      ).all(),
      getTeacherAssignments({ schoolId, teacherId: teacher.id }),
    ]);

  const classById = new Map(classes.map((item) => [item.id, item]));
  const subjectById = new Map(subjects.map((item) => [item.id, item]));
  const seenPairs = new Set<string>();

  const teachingOptions = teacherAssignments
    .filter((item) => item.schoolId === schoolId)
    .flatMap((item) => {
      const schoolClass = classById.get(item.classId);
      const subject = subjectById.get(item.subjectId);
      const pair = `${item.classId}:${item.subjectId}`;

      if (!schoolClass || !subject || seenPairs.has(pair)) {
        return [];
      }

      seenPairs.add(pair);

      return [{
        classId: item.classId,
        subjectId: item.subjectId,
        className: schoolClass.name,
        subjectName: subject.name,
      }];
    })
    .sort((a, b) =>
      a.className.localeCompare(b.className) ||
      a.subjectName.localeCompare(b.subjectName),
    );

  const initialAssignments = assignments.map((item) => ({
    id: item.id,
    classId: item.classId,
    subjectId: item.subjectId,
    title: item.title,
    instructions: item.instructions,
    dueDate: item.dueDate ? String(item.dueDate) : null,
    maxScore: item.maxScore,
    isPublished: item.isPublished,
    publishedAt: item.publishedAt ? String(item.publishedAt) : null,
    createdAt: item.createdAt ? String(item.createdAt) : null,
  }));

  return (
    <TeacherAssignmentsClient
      teachingOptions={teachingOptions}
      initialAssignments={initialAssignments}
    />
  );
}
