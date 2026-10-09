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

export async function promoteStudents(
  schoolId: number,
  studentIds: number[],
  fromClassId: number,
  toClassId: number,
) {
  if (studentIds.length === 0) {
    throw new Error("No students were selected.");
  }

  if (fromClassId === toClassId) {
    throw new Error(
      "The destination class must be different from the current class.",
    );
  }

  const fromClass = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.id.eq(fromClassId),
  ).first();

  if (!fromClass || fromClass.schoolId !== schoolId) {
    throw new Error("Invalid current class.");
  }

  const toClass = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.id.eq(toClassId),
  ).first();

  if (!toClass || toClass.schoolId !== schoolId) {
    throw new Error("Invalid destination class.");
  }

  const students = await db.orm.public.Student.where((student) =>
    student.schoolId.eq(schoolId),
  ).all();

  const selectedStudents = students.filter(
    (student) =>
      studentIds.includes(student.id) &&
      student.classId === fromClassId &&
      student.isActive,
  );

  if (selectedStudents.length !== studentIds.length) {
    throw new Error(
      "One or more selected students are invalid, inactive, or do not belong to the selected class.",
    );
  }

  for (const student of selectedStudents) {
    await db.orm.public.Student.where((studentRecord) =>
      studentRecord.id.eq(student.id),
    ).update({
      classId: toClassId,
    });
  }

  return {
    count: selectedStudents.length,
    fromClass: fromClass.name,
    toClass: toClass.name,
  };
}
