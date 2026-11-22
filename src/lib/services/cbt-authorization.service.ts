import { db } from "@/prisma/db";

type CBTAuthorizationInput = {
  schoolId: number;
  userId: number;
  role: string;
};

type CBTClassSubjectAccessInput = CBTAuthorizationInput & {
  classId: number;
  subjectId: number;
};

type CBTSubjectAccessInput = CBTAuthorizationInput & {
  subjectId: number;
};

type CBTQuestionBankAccessInput = CBTAuthorizationInput & {
  bankId: number;
};

const ADMIN_ROLES = ["SCHOOL_OWNER", "SCHOOL_ADMIN"];

function isValidId(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function validateContext(input: CBTAuthorizationInput): void {
  if (
    !isValidId(input.schoolId) ||
    !isValidId(input.userId)
  ) {
    throw new Error("Invalid CBT authorization context.");
  }
}

async function getTeacher(userId: number, schoolId: number) {
  const teacher = await db.orm.public.Teacher.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    return null;
  }

  return teacher;
}

export async function assertCBTSubjectAccess(
  input: CBTSubjectAccessInput,
): Promise<void> {
  validateContext(input);

  if (!isValidId(input.subjectId)) {
    throw new Error("Invalid subject.");
  }

  if (ADMIN_ROLES.includes(input.role)) {
    return;
  }

  if (input.role !== "TEACHER") {
    throw new Error("You are not authorized to access this subject.");
  }

  const teacher = await getTeacher(input.userId, input.schoolId);

  if (!teacher) {
    throw new Error("Teacher record not found.");
  }

  const assignments = await db.orm.public.TeacherAssignment.where(
    (item) => item.teacherId.eq(teacher.id),
  ).all();

  const hasAccess = assignments.some(
    (assignment) =>
      assignment.schoolId === input.schoolId &&
      assignment.subjectId === input.subjectId,
  );

  if (!hasAccess) {
    throw new Error("You are not assigned to teach this subject.");
  }
}

export async function assertCBTClassSubjectAccess(
  input: CBTClassSubjectAccessInput,
): Promise<void> {
  validateContext(input);

  if (
    !isValidId(input.classId) ||
    !isValidId(input.subjectId)
  ) {
    throw new Error("Invalid class or subject.");
  }

  if (ADMIN_ROLES.includes(input.role)) {
    return;
  }

  if (input.role !== "TEACHER") {
    throw new Error("You are not authorized to access this class and subject.");
  }

  const teacher = await getTeacher(input.userId, input.schoolId);

  if (!teacher) {
    throw new Error("Teacher record not found.");
  }

  const assignments = await db.orm.public.TeacherAssignment.where(
    (item) => item.teacherId.eq(teacher.id),
  ).all();

  const hasAccess = assignments.some(
    (assignment) =>
      assignment.schoolId === input.schoolId &&
      assignment.classId === input.classId &&
      assignment.subjectId === input.subjectId,
  );

  if (!hasAccess) {
    throw new Error(
      "You are not assigned to teach this subject in this class.",
    );
  }
}

export async function assertCBTQuestionBankAccess(
  input: CBTQuestionBankAccessInput,
) {
  validateContext(input);

  if (!isValidId(input.bankId)) {
    throw new Error("Invalid question bank.");
  }

  const bank = await db.orm.public.CBTQuestionBank.where((item) =>
    item.id.eq(input.bankId),
  ).first();

  if (!bank || bank.schoolId !== input.schoolId) {
    throw new Error("Question bank not found.");
  }

  if (ADMIN_ROLES.includes(input.role)) {
    return bank;
  }

  if (input.role !== "TEACHER") {
    throw new Error("You are not authorized to access this question bank.");
  }

  if (bank.createdById !== input.userId) {
    throw new Error("You can only manage your own question banks.");
  }

  await assertCBTSubjectAccess({
    schoolId: input.schoolId,
    userId: input.userId,
    role: input.role,
    subjectId: bank.subjectId,
  });

  return bank;
}
