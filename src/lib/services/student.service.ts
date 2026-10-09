import { db } from "@/prisma/db";
import { deleteUploadedFile } from "@/lib/utils/file-upload";

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

export async function updateStudent(
  schoolId: number,
  studentId: number,
  data: {
    admissionNumber: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender: "MALE" | "FEMALE";
    dateOfBirth?: string;
    email?: string;
    phone?: string;
    address?: string;
    classId?: string;
  },
) {
  const student = await db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    throw new Error("Student not found.");
  }

  const duplicate = await db.orm.public.Student.where((student) =>
    student.admissionNumber.eq(data.admissionNumber),
  ).all();

  const duplicateInSchool = duplicate.find(
    (existingStudent) =>
      existingStudent.schoolId === schoolId && existingStudent.id !== studentId,
  );

  if (duplicateInSchool) {
    throw new Error("A student with this admission number already exists.");
  }

  let classId: number | null = null;

  if (data.classId) {
    classId = Number(data.classId);

    if (!Number.isInteger(classId)) {
      throw new Error("Invalid class.");
    }

    const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
      schoolClass.id.eq(classId!),
    ).first();

    if (!schoolClass || schoolClass.schoolId !== schoolId) {
      throw new Error("Invalid class.");
    }
  }

  const dateOfBirth = data.dateOfBirth
    ? globalThis.Temporal.Instant.from(`${data.dateOfBirth}T00:00:00Z`)
    : null;

  return db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).update({
    admissionNumber: data.admissionNumber,
    firstName: data.firstName,
    middleName: data.middleName || null,
    lastName: data.lastName,
    gender: data.gender,
    dateOfBirth,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
    classId,
  });
}

export async function deactivateStudent(schoolId: number, studentId: number) {
  const student = await db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    throw new Error("Student not found.");
  }

  if (!student.isActive) {
    throw new Error("Student is already inactive.");
  }

  return db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).update({
    isActive: false,
  });
}

export async function reactivateStudent(schoolId: number, studentId: number) {
  const student = await db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    throw new Error("Student not found.");
  }

  if (student.isActive) {
    throw new Error("Student is already active.");
  }

  return db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).update({
    isActive: true,
  });
}

export async function updateStudentPhoto(
  schoolId: number,
  studentId: number,
  photoUrl: string | null,
) {
  const student = await db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    throw new Error("Student not found.");
  }

  const oldPhotoUrl = student.photoUrl;

  const updatedStudent = await db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).update({
    photoUrl,
  });

  if (oldPhotoUrl && oldPhotoUrl !== photoUrl) {
    // Delete the old file only after the database update succeeds.
    await deleteUploadedFile(oldPhotoUrl, schoolId);
  }

  return updatedStudent;
}