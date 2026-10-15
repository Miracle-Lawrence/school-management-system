import { db } from "@/prisma/db";

export interface CreateGradeScaleSetInput {
  schoolId: number;
  name: string;
}

export interface UpdateGradeScaleSetInput {
  name?: string;
  isActive?: boolean;
}

async function getGradeScaleSetById(gradeScaleSetId: number) {
  return db.orm.public.GradeScaleSet.where((item) =>
    item.id.eq(gradeScaleSetId),
  ).first();
}

async function validateGradeScaleSetOwnership(
  schoolId: number,
  gradeScaleSetId: number,
) {
  const gradeScaleSet = await getGradeScaleSetById(gradeScaleSetId);

  if (!gradeScaleSet || gradeScaleSet.schoolId !== schoolId) {
    throw new Error("Invalid grading set for this school.");
  }

  return gradeScaleSet;
}

export async function getGradeScaleSetsForSchool(schoolId: number) {
  const gradeScaleSets = await db.orm.public.GradeScaleSet.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  return gradeScaleSets.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createGradeScaleSet(input: CreateGradeScaleSetInput) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Grading set name is required.");
  }

  const existingSets = await getGradeScaleSetsForSchool(input.schoolId);

  if (
    existingSets.some((item) => item.name.toLowerCase() === name.toLowerCase())
  ) {
    throw new Error("A grading set with this name already exists.");
  }

  return db.orm.public.GradeScaleSet.create({
    schoolId: input.schoolId,
    name,
    isActive: true,
  });
}

export async function updateGradeScaleSet(
  schoolId: number,
  gradeScaleSetId: number,
  input: UpdateGradeScaleSetInput,
) {
  const currentSet = await validateGradeScaleSetOwnership(
    schoolId,
    gradeScaleSetId,
  );

  const updateData: UpdateGradeScaleSetInput = {};

  if (input.name !== undefined) {
    const name = input.name.trim();

    if (!name) {
      throw new Error("Grading set name is required.");
    }

    const existingSets = await getGradeScaleSetsForSchool(schoolId);

    if (
      existingSets.some(
        (item) =>
          item.id !== gradeScaleSetId &&
          item.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      throw new Error("A grading set with this name already exists.");
    }

    updateData.name = name;
  }

  if (input.isActive !== undefined) {
    if (input.isActive === false) {
      const configurations = await db.orm.public.ReportConfiguration.where(
        (item) => item.schoolId.eq(schoolId),
      ).all();

      const isAssigned = configurations.some(
        (configuration) =>
          configuration.gradeScaleSetId === gradeScaleSetId &&
          configuration.isActive,
      );

      if (isAssigned) {
        throw new Error(
          "This grading set is assigned to an active report configuration. Assign another active grading set before deactivating it.",
        );
      }
    }

    updateData.isActive = input.isActive;
  }

  if (Object.keys(updateData).length === 0) {
    return currentSet;
  }

  return db.orm.public.GradeScaleSet.where((item) =>
    item.id.eq(gradeScaleSetId),
  ).update(updateData);
}
