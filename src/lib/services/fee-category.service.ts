import { db } from "@/prisma/db";

type CreateFeeCategoryInput = {
  schoolId: number;
  name: string;
  description?: string;
};

export async function getFeeCategories(schoolId: number) {
  const categories = await db.orm.public.FeeCategory.where((category) =>
    category.schoolId.eq(schoolId),
  ).all();

  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createFeeCategory(input: CreateFeeCategoryInput) {
  const name = input.name.trim();
  const description = input.description?.trim() || null;

  if (name.length < 2 || name.length > 100) {
    throw new Error("Category name must be between 2 and 100 characters.");
  }

  // Check for an existing category with this name in the same school.
  const schoolCategories = await db.orm.public.FeeCategory.where((category) =>
    category.schoolId.eq(input.schoolId),
  ).all();

  const duplicate = schoolCategories.some(
    (category) => category.name.toLowerCase() === name.toLowerCase(),
  );

  if (duplicate) {
    throw new Error("A fee category with this name already exists.");
  }

  return db.orm.public.FeeCategory.create({
    schoolId: input.schoolId,
    name,
    description,
    isActive: true,
  });
}
