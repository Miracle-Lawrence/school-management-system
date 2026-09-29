import { db } from "@/prisma/db";

type CreateTeacherData = {
  employeeId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
};

export async function createTeacher(schoolId: number, data: CreateTeacherData) {
  const existingTeachers = await db.orm.public.Teacher.where((teacher) =>
    teacher.schoolId.eq(schoolId),
  ).all();

  const existingTeacher = existingTeachers.find(
    (teacher) =>
      teacher.employeeId.toLowerCase() === data.employeeId.toLowerCase(),
  );

  if (existingTeacher) {
    throw new Error("A teacher with this employee ID already exists.");
  }

  const teacher = await db.orm.public.Teacher.create({
    schoolId,
    employeeId: data.employeeId,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone || null,
    email: data.email || null,
  });

  return teacher;
}
