import { hashPassword } from "@/lib/auth/password";
import { db } from "@/prisma/db";
import type { CreateTeacherInput } from "@/lib/validation/teacher";


export async function createTeacher(
  schoolId: number,
  data: CreateTeacherInput,
) {
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

  const normalizedEmail = data.email.trim().toLowerCase();

  const existingUser = await db.orm.public.User.where((user) =>
    user.email.eq(normalizedEmail),
  ).first();

  if (existingUser) {
    throw new Error("An account with this email address already exists.");
  }

  const passwordHash = await hashPassword(data.password);

  const user = await db.orm.public.User.create({
    schoolId,
    email: normalizedEmail,
    passwordHash,
    name: `${data.firstName} ${data.lastName}`,
    phone: data.phone || null,
    role: "TEACHER",
    isActive: true,
  });

  try {
    const teacher = await db.orm.public.Teacher.create({
      schoolId,
      userId: user.id,
      employeeId: data.employeeId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      email: normalizedEmail,
    });

    return {
      ...teacher,
      loginEmail: normalizedEmail,
    };
  } catch (error) {
    // Avoid leaving an orphaned login account if profile creation fails.
    await db.orm.public.User.where((item) => item.id.eq(user.id)).delete();

    throw error;
  }
}


type UpdateTeacherData = {
  employeeId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
};

export async function updateTeacher(
  schoolId: number,
  teacherId: number,
  data: UpdateTeacherData,
) {
  const teacher = await db.orm.public.Teacher.where((item) =>
    item.id.eq(teacherId),
  ).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    throw new Error("Teacher not found.");
  }

  const employeeId = data.employeeId.trim();
  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  const email = data.email.trim().toLowerCase();
  const phone = data.phone?.trim() || "";

  const teachers = await db.orm.public.Teacher.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const duplicateEmployeeId = teachers.find(
    (item) =>
      item.id !== teacherId &&
      item.employeeId.toLowerCase() === employeeId.toLowerCase(),
  );

  if (duplicateEmployeeId) {
    throw new Error("A teacher with this employee ID already exists.");
  }

  const users = await db.orm.public.User.where((item) =>
    item.email.eq(email),
  ).all();

  const linkedUser = teacher.userId
    ? users.find((item) => item.id === teacher.userId)
    : undefined;

  const duplicateEmail = users.find((item) => item.id !== teacher.userId);

  if (duplicateEmail) {
    throw new Error("An account with this email address already exists.");
  }

  const updatedTeacher = await db.orm.public.Teacher.where((item) =>
    item.id.eq(teacherId),
  ).update({
    employeeId,
    firstName,
    lastName,
    email,
    phone: phone || null,
  });

  if (teacher.userId && !linkedUser) {
    throw new Error(
      "The teacher's login account could not be found. The profile was updated; please verify the account before retrying.",
    );
  }

  if (linkedUser) {
    await db.orm.public.User.where((item) => item.id.eq(linkedUser.id)).update({
      email,
      name: `${firstName} ${lastName}`,
      phone: phone || null,
    });
  }

  return updatedTeacher;
}
