import { db } from "@/prisma/db";

type CreateStudentData = {
  admissionNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  classId?: number;
};

export async function createStudent(schoolId: number, data: CreateStudentData) {
  const existingStudents = await db.orm.public.Student.where((student) =>
    student.schoolId.eq(schoolId),
  ).all();

  const existingStudent = existingStudents.find(
    (student) => student.admissionNumber === data.admissionNumber,
  );

  if (existingStudent) {
    throw new Error("A student with this admission number already exists.");
  }

  const classId = data.classId;

  if (classId !== undefined) {
    const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
      schoolClass.id.eq(classId),
    ).first();

    if (!schoolClass || schoolClass.schoolId !== schoolId) {
      throw new Error("Invalid class.");
    }
  }

  const student = await db.orm.public.Student.create({
    schoolId,
    admissionNumber: data.admissionNumber,
    firstName: data.firstName,
    middleName: data.middleName || null,
    lastName: data.lastName,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth
      ? Temporal.Instant.from(`${data.dateOfBirth}T00:00:00Z`)
      : null,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
    classId: data.classId ?? null,
  });

  return student;
}
