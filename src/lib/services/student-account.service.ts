import { hashPassword } from "@/lib/auth/password";
import { db } from "@/prisma/db";

function validateStudentPassword(password: string) {
  if (password.length !== 4 || password.trim().length === 0) {
    throw new Error("The student password must contain exactly 4 characters.");
  }
}

export async function createStudentLogin(
  schoolId: number,
  studentId: number,
  password: string,
) {
  validateStudentPassword(password);

  const student = await db.orm.public.Student.where((record) =>
    record.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    throw new Error("Student not found in this school.");
  }

  if (!student.isActive) {
    throw new Error("Cannot create a login for an inactive student.");
  }

  if (!student.email?.trim()) {
    throw new Error(
      "This student has no email address. Update the student profile before creating a login.",
    );
  }

  if (student.userId) {
    throw new Error("This student already has a linked login account.");
  }

  const email = student.email.trim().toLowerCase();

  const existingUser = await db.orm.public.User.where((record) =>
    record.email.eq(email),
  ).first();

  if (existingUser) {
    throw new Error(
      "This email address is already associated with another account.",
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await db.orm.public.User.create({
    schoolId,
    email,
    passwordHash,
    name: `${student.firstName} ${student.lastName}`,
    phone: student.phone ?? null,
    role: "STUDENT",
    isActive: true,
    mustChangePassword: true,
  });

  try {
    await db.orm.public.Student.where((record) =>
      record.id.eq(studentId),
    ).update({
      userId: user.id,
    });
  } catch (error) {
    await db.orm.public.User.where((record) => record.id.eq(user.id)).delete();
    throw error;
  }

  return {
    loginEmail: email,
    temporaryPassword: password,
  };
}

export async function resetStudentPassword(
  schoolId: number,
  studentId: number,
  password: string,
) {
  validateStudentPassword(password);

  const student = await db.orm.public.Student.where((record) =>
    record.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    throw new Error("Student not found in this school.");
  }

  if (!student.userId) {
    throw new Error(
      "This student does not have a linked login account. Create one first.",
    );
  }

  const user = await db.orm.public.User.where((record) =>
    record.id.eq(student.userId!),
  ).first();

  if (!user || user.schoolId !== schoolId || user.role !== "STUDENT") {
    throw new Error("The linked student login could not be verified.");
  }

  const passwordHash = await hashPassword(password);

  await db.orm.public.User.where((record) => record.id.eq(user.id)).update({
    passwordHash,
    mustChangePassword: true,
    sessionVersion: user.sessionVersion + 1,
  });

  return {
    loginEmail: user.email,
    temporaryPassword: password,
  };
}
