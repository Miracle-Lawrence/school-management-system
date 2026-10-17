import { db } from "@/prisma/db";
import type { CreateFeeStructureInput } from "@/lib/validation/fee-structure";

type CreateFeeStructureData = CreateFeeStructureInput & {
  schoolId: number;
};

export async function getFeeStructureOptions(schoolId: number) {
  const [categories, classes, sessions] = await Promise.all([
    db.orm.public.FeeCategory.where((item) => item.schoolId.eq(schoolId)).all(),
    db.orm.public.SchoolClass.where((item) => item.schoolId.eq(schoolId)).all(),
    db.orm.public.AcademicSession.where((item) =>
      item.schoolId.eq(schoolId),
    ).all(),
  ]);

  return {
    categories: categories
      .filter((item) => item.isActive)
      .sort((a, b) => a.name.localeCompare(b.name)),
    classes: classes.sort((a, b) => a.name.localeCompare(b.name)),
    sessions: sessions.sort((a, b) => b.name.localeCompare(a.name)),
  };
}

export async function getTermsForSession(schoolId: number, sessionId: number) {
  const session = await db.orm.public.AcademicSession.where((item) =>
    item.id.eq(sessionId),
  ).first();

  if (!session || session.schoolId !== schoolId) {
    throw new Error("Invalid academic session.");
  }

  const terms = await db.orm.public.Term.where((item) =>
    item.sessionId.eq(sessionId),
  ).all();

  return terms.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getFeeStructures(schoolId: number) {
  const structures = await db.orm.public.FeeStructure.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  return structures.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createFeeStructure(input: CreateFeeStructureData) {
  const {
    schoolId,
    categoryId,
    classId,
    sessionId,
    termId,
    amount,
    isMandatory,
    isActive,
  } = input;

  const [category, schoolClass, session, term] = await Promise.all([
    db.orm.public.FeeCategory.where((item) => item.id.eq(categoryId)).first(),
    db.orm.public.SchoolClass.where((item) => item.id.eq(classId)).first(),
    db.orm.public.AcademicSession.where((item) =>
      item.id.eq(sessionId),
    ).first(),
    db.orm.public.Term.where((item) => item.id.eq(termId)).first(),
  ]);

  if (!category || category.schoolId !== schoolId || !category.isActive) {
    throw new Error("Select an active fee category belonging to your school.");
  }

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    throw new Error("Select a class belonging to your school.");
  }

  if (!session || session.schoolId !== schoolId) {
    throw new Error("Select an academic session belonging to your school.");
  }

  if (!term || term.sessionId !== sessionId) {
    throw new Error(
      "Select a term belonging to the selected academic session.",
    );
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("The fee amount must be greater than zero.");
  }

  const existingStructures = await db.orm.public.FeeStructure.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const duplicate = existingStructures.some(
    (item) =>
      item.categoryId === categoryId &&
      item.classId === classId &&
      item.termId === termId,
  );

  if (duplicate) {
    throw new Error(
      "A fee structure already exists for this category, class, and term.",
    );
  }

  return db.orm.public.FeeStructure.create({
    schoolId,
    categoryId,
    classId,
    sessionId,
    termId,
    amount: amount.trim(),
    isMandatory,
    isActive,
  });
}
