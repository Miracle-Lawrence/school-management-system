import { db } from "@/prisma/db";

export async function assignStudentToClass(
  schoolId: number,
  studentId: number,
  classId: number,
) {
  const student = await db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    throw new Error("Invalid student.");
  }

  const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    throw new Error("Invalid class.");
  }

  return db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).update({
    classId,
  });
}
