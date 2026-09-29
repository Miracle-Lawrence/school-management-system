import { db } from "@/prisma/db";

type CreateClassData = {
  name: string;
  level?: string;
  description?: string;
};

export async function createClass(schoolId: number, data: CreateClassData) {
  const existingClasses = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.schoolId.eq(schoolId),
  ).all();

  const existingClass = existingClasses.find(
    (schoolClass) => schoolClass.name.toLowerCase() === data.name.toLowerCase(),
  );

  if (existingClass) {
    throw new Error("A class with this name already exists.");
  }

  const schoolClass = await db.orm.public.SchoolClass.create({
    schoolId,
    name: data.name,
    level: data.level || null,
    description: data.description || null,
  });

  return schoolClass;
}
