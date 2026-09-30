import { db } from "@/prisma/db";

export async function assignSubjectToClass(
  schoolId: number,
  classId: number,
  subjectId: number,
) {
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

  const existingAssignments = await db.orm.public.ClassSubject.where(
    (assignment) => assignment.classId.eq(classId),
  ).all();

  const alreadyAssigned = existingAssignments.some(
    (assignment) => assignment.subjectId === subjectId,
  );

  if (alreadyAssigned) {
    throw new Error("This subject is already assigned to this class.");
  }

  return db.orm.public.ClassSubject.create({
    schoolId,
    classId,
    subjectId,
  });
}
