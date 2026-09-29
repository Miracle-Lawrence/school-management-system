import { db } from "@/prisma/db";

export async function linkStudentToParent(
  schoolId: number,
  parentId: number,
  studentId: number,
) {
  const parent = await db.orm.public.Parent.where((parent) =>
    parent.id.eq(parentId),
  ).first();

  if (!parent || parent.schoolId !== schoolId) {
    throw new Error("Invalid parent.");
  }

  const student = await db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    throw new Error("Invalid student.");
  }

  const existingLinks = await db.orm.public.ParentStudent.where((link) =>
    link.parentId.eq(parentId),
  ).all();

  const alreadyLinked = existingLinks.some(
    (link) => link.studentId === studentId,
  );

  if (alreadyLinked) {
    throw new Error("This student is already linked to this parent.");
  }

  return db.orm.public.ParentStudent.create({
    parentId,
    studentId,
  });
}
