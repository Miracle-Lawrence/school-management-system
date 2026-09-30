import { db } from "@/prisma/db";

export async function assignTeacherToClassSubject(
  schoolId: number,
  teacherId: number,
  classId: number,
  subjectId: number,
) {
  const teacher = await db.orm.public.Teacher.where((teacher) =>
    teacher.id.eq(teacherId),
  ).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    throw new Error("Invalid teacher.");
  }

  const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    throw new Error("Invalid class.");
  }

  const subject = await db.orm.public.Subject.where((subject) =>
    subject.id.eq(subjectId),
  ).first();

  if (!subject || subject.schoolId !== schoolId) {
    throw new Error("Invalid subject.");
  }

  const classSubjects = await db.orm.public.ClassSubject.where((assignment) =>
    assignment.classId.eq(classId),
  ).all();

  const classHasSubject = classSubjects.some(
    (assignment) => assignment.subjectId === subjectId,
  );

  if (!classHasSubject) {
    throw new Error("This subject is not assigned to this class.");
  }

  const existingAssignments = await db.orm.public.TeacherAssignment.where(
    (assignment) => assignment.classId.eq(classId),
  ).all();

  const alreadyAssigned = existingAssignments.some(
    (assignment) =>
      assignment.teacherId === teacherId && assignment.subjectId === subjectId,
  );

  if (alreadyAssigned) {
    throw new Error(
      "This teacher is already assigned to this subject and class.",
    );
  }

  return db.orm.public.TeacherAssignment.create({
    schoolId,
    teacherId,
    classId,
    subjectId,
  });
}
