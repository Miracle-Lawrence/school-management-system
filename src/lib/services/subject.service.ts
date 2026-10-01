import { db } from "@/prisma/db";

type CreateSubjectData = {
  name: string;
  code?: string;
  description?: string;
};

export async function createSubject(schoolId: number, data: CreateSubjectData) {
  const existingSubjects = await db.orm.public.Subject.where((subject) =>
    subject.schoolId.eq(schoolId),
  ).all();

  const existingSubject = existingSubjects.find(
    (subject) => subject.name.toLowerCase() === data.name.toLowerCase(),
  );

  if (existingSubject) {
    throw new Error("A subject with this name already exists.");
  }

  const subject = await db.orm.public.Subject.create({
    schoolId,
    name: data.name,
    code: data.code || null,
    description: data.description || null,
  });

  return subject;
}

type UpdateSubjectData = {
  name: string;
  code?: string;
  description?: string;
};

export async function updateSubject(
  schoolId: number,
  subjectId: number,
  data: UpdateSubjectData,
) {
  const subject = await db.orm.public.Subject.where((subject) =>
    subject.id.eq(subjectId),
  ).first();

  if (!subject || subject.schoolId !== schoolId) {
    throw new Error("Subject not found.");
  }

  const existingSubjects = await db.orm.public.Subject.where((subject) =>
    subject.schoolId.eq(schoolId),
  ).all();

  const duplicateSubject = existingSubjects.find(
    (existingSubject) =>
      existingSubject.id !== subjectId &&
      existingSubject.name.toLowerCase() === data.name.toLowerCase(),
  );

  if (duplicateSubject) {
    throw new Error("A subject with this name already exists.");
  }

  return db.orm.public.Subject.where((subject) =>
    subject.id.eq(subjectId),
  ).update({
    name: data.name,
    code: data.code || null,
    description: data.description || null,
  });
}
