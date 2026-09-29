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
