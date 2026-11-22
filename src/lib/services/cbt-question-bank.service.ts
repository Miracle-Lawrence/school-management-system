import { db } from "@/prisma/db";
import {
  assertCBTQuestionBankAccess,
  assertCBTSubjectAccess,
} from "@/lib/services/cbt-authorization.service";

type CBTUserContext = {
  schoolId: number;
  userId: number;
  role: string;
};

type CreateCBTQuestionBankInput = CBTUserContext & {
  subjectId: number;
  title: string;
  description?: string;
};

type UpdateCBTQuestionBankInput = CBTUserContext & {
  bankId: number;
  title?: string;
  description?: string | null;
  isActive?: boolean;
};

function validateTitle(title: string): string {
  const normalized = title.trim();

  if (normalized.length < 2 || normalized.length > 150) {
    throw new Error("Question bank title must be between 2 and 150 characters.");
  }

  return normalized;
}

async function validateSubject(schoolId: number, subjectId: number) {
  const subject = await db.orm.public.Subject.where((item) =>
    item.id.eq(subjectId),
  ).first();

  if (!subject || subject.schoolId !== schoolId) {
    throw new Error("Invalid subject for this school.");
  }

  return subject;
}

async function ensureUniqueTitle(
  subjectId: number,
  title: string,
  excludeId?: number,
) {
  const banks = await db.orm.public.CBTQuestionBank.where((bank) =>
    bank.subjectId.eq(subjectId),
  ).all();

  const duplicate = banks.some(
    (bank) =>
      bank.id !== excludeId &&
      bank.title.toLowerCase() === title.toLowerCase(),
  );

  if (duplicate) {
    throw new Error(
      "A question bank with this title already exists for this subject.",
    );
  }
}

export async function getCBTQuestionBanks(
  input: CBTUserContext & {
    subjectId?: number;
    includeInactive?: boolean;
  },
) {
  const banks = await db.orm.public.CBTQuestionBank.where((bank) =>
    bank.schoolId.eq(input.schoolId),
  ).all();

  let visibleBanks = banks;

  if (input.role === "TEACHER") {
    const teacher = await db.orm.public.Teacher.where((item) =>
      item.userId.eq(input.userId),
    ).first();

    if (!teacher || teacher.schoolId !== input.schoolId) {
      throw new Error("Teacher record not found.");
    }

    const assignments = await db.orm.public.TeacherAssignment.where(
      (item) => item.teacherId.eq(teacher.id),
    ).all();

    const assignedSubjectIds = new Set(
      assignments
        .filter((assignment) => assignment.schoolId === input.schoolId)
        .map((assignment) => assignment.subjectId),
    );

    visibleBanks = banks.filter(
      (bank) =>
        bank.createdById === input.userId &&
        assignedSubjectIds.has(bank.subjectId),
    );
  } else if (
    input.role !== "SCHOOL_OWNER" &&
    input.role !== "SCHOOL_ADMIN"
  ) {
    throw new Error("You are not authorized to view question banks.");
  }

  return visibleBanks
    .filter((bank) => {
      if (
        input.subjectId !== undefined &&
        bank.subjectId !== input.subjectId
      ) {
        return false;
      }

      return input.includeInactive === true || bank.isActive;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function getCBTQuestionBankById(
  input: CBTUserContext & {
    bankId: number;
  },
) {
  const bank = await assertCBTQuestionBankAccess(input);

  const questions = await db.orm.public.CBTQuestion.where((question) =>
    question.bankId.eq(input.bankId),
  ).all();

  return {
    ...bank,
    questions: questions.sort((a, b) => a.id - b.id),
  };
}

export async function createCBTQuestionBank(
  input: CreateCBTQuestionBankInput,
) {
  const title = validateTitle(input.title);

  await validateSubject(input.schoolId, input.subjectId);

  await assertCBTSubjectAccess({
    schoolId: input.schoolId,
    userId: input.userId,
    role: input.role,
    subjectId: input.subjectId,
  });

  const creator = await db.orm.public.User.where((user) =>
    user.id.eq(input.userId),
  ).first();

  if (
    !creator ||
    creator.schoolId !== input.schoolId ||
    !creator.isActive
  ) {
    throw new Error("Invalid question bank creator.");
  }

  await ensureUniqueTitle(input.subjectId, title);

  return db.orm.public.CBTQuestionBank.create({
    schoolId: input.schoolId,
    subjectId: input.subjectId,
    createdById: input.userId,
    title,
    description: input.description?.trim() || null,
    isActive: true,
  });
}

export async function updateCBTQuestionBank(
  input: UpdateCBTQuestionBankInput,
) {
  const bank = await assertCBTQuestionBankAccess(input);

  const title =
    input.title === undefined ? bank.title : validateTitle(input.title);

  if (input.title !== undefined) {
    await ensureUniqueTitle(bank.subjectId, title, bank.id);
  }

  return db.orm.public.CBTQuestionBank.where((item) =>
    item.id.eq(bank.id),
  ).update({
    title,
    description:
      input.description === undefined
        ? bank.description
        : input.description?.trim() || null,
    isActive: input.isActive ?? bank.isActive,
  });
}

export async function deactivateCBTQuestionBank(
  input: CBTUserContext & {
    bankId: number;
  },
) {
  const bank = await assertCBTQuestionBankAccess(input);

  if (!bank.isActive) {
    return bank;
  }

  return db.orm.public.CBTQuestionBank.where((item) =>
    item.id.eq(input.bankId),
  ).update({
    isActive: false,
  });
}
