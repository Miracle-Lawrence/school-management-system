import { db } from "@/prisma/db";

interface CreateGradeScaleInput {
  schoolId: number;
  name: string;
  code: string;
  minScore: number;
  maxScore: number;
  remark?: string;
  displayOrder: number;
  isActive?: boolean;
}

interface UpdateGradeScaleInput {
  name?: string;
  code?: string;
  minScore?: number;
  maxScore?: number;
  remark?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

function validateScoreRange(minScore: number, maxScore: number) {
  if (!Number.isFinite(minScore) || !Number.isFinite(maxScore)) {
    throw new Error("Grade scores must be valid numbers.");
  }

  if (minScore < 0 || maxScore > 100) {
    throw new Error("Grade scores must be between 0 and 100.");
  }

  if (minScore >= maxScore) {
    throw new Error("Minimum score must be less than maximum score.");
  }
}

function validateDisplayOrder(displayOrder: number) {
  if (!Number.isInteger(displayOrder) || displayOrder < 1) {
    throw new Error("Display order must be a positive integer.");
  }
}

async function getGradeScaleById(gradeScaleId: number) {
  return db.orm.public.GradeScale.where((gradeScale) =>
    gradeScale.id.eq(gradeScaleId),
  ).first();
}

async function validateGradeScaleOwnership(
  gradeScaleId: number,
  schoolId: number,
) {
  const gradeScale = await getGradeScaleById(gradeScaleId);

  if (!gradeScale || gradeScale.schoolId !== schoolId) {
    throw new Error("Invalid grade scale.");
  }

  return gradeScale;
}

async function validateNoOverlap(
  schoolId: number,
  minScore: number,
  maxScore: number,
  excludeGradeScaleId?: number,
) {
  const gradeScales = await db.orm.public.GradeScale.where((gradeScale) =>
    gradeScale.schoolId.eq(schoolId),
  ).all();

  const overlaps = gradeScales.some((gradeScale) => {
    if (
      excludeGradeScaleId !== undefined &&
      gradeScale.id === excludeGradeScaleId
    ) {
      return false;
    }

    return minScore <= gradeScale.maxScore && maxScore >= gradeScale.minScore;
  });

  if (overlaps) {
    throw new Error("This grade range overlaps with an existing grade scale.");
  }
}

/**
 * Create a grade scale for a school.
 *
 * Example:
 * A = 70 - 100
 * B = 60 - 69
 * C = 50 - 59
 */
export async function createGradeScale(input: CreateGradeScaleInput) {
  const name = input.name.trim();
  const code = input.code.trim().toUpperCase();
  const remark = input.remark?.trim() || null;

  if (!name) {
    throw new Error("Grade scale name is required.");
  }

  if (!code) {
    throw new Error("Grade scale code is required.");
  }

  validateScoreRange(input.minScore, input.maxScore);
  validateDisplayOrder(input.displayOrder);

  const existingGradeScales = await db.orm.public.GradeScale.where(
    (gradeScale) => gradeScale.schoolId.eq(input.schoolId),
  ).all();

  const duplicateCode = existingGradeScales.some(
    (gradeScale) => gradeScale.code.toUpperCase() === code,
  );

  if (duplicateCode) {
    throw new Error(`A grade scale with code "${code}" already exists.`);
  }

  await validateNoOverlap(input.schoolId, input.minScore, input.maxScore);

  return db.orm.public.GradeScale.create({
    schoolId: input.schoolId,
    name,
    code,
    minScore: input.minScore,
    maxScore: input.maxScore,
    remark,
    displayOrder: input.displayOrder,
    isActive: input.isActive ?? true,
  });
}

/**
 * Get all grade scales belonging to a school.
 */
export async function getGradeScales(schoolId: number) {
  const gradeScales = await db.orm.public.GradeScale.where((gradeScale) =>
    gradeScale.schoolId.eq(schoolId),
  ).all();

  return gradeScales.sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get only active grade scales belonging to a school.
 */
export async function getActiveGradeScales(schoolId: number) {
  const gradeScales = await db.orm.public.GradeScale.where((gradeScale) =>
    gradeScale.schoolId.eq(schoolId),
  ).all();

  return gradeScales
    .filter((gradeScale) => gradeScale.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get a single grade scale.
 */
export async function getGradeScale(schoolId: number, gradeScaleId: number) {
  return validateGradeScaleOwnership(gradeScaleId, schoolId);
}

/**
 * Update a grade scale.
 */
export async function updateGradeScale(
  schoolId: number,
  gradeScaleId: number,
  input: UpdateGradeScaleInput,
) {
  const gradeScale = await validateGradeScaleOwnership(gradeScaleId, schoolId);

  const name = input.name !== undefined ? input.name.trim() : gradeScale.name;

  const code =
    input.code !== undefined
      ? input.code.trim().toUpperCase()
      : gradeScale.code;

  const minScore =
    input.minScore !== undefined ? input.minScore : gradeScale.minScore;

  const maxScore =
    input.maxScore !== undefined ? input.maxScore : gradeScale.maxScore;

  const remark =
    input.remark !== undefined
      ? input.remark?.trim() || null
      : gradeScale.remark;

  const displayOrder =
    input.displayOrder !== undefined
      ? input.displayOrder
      : gradeScale.displayOrder;

  const isActive =
    input.isActive !== undefined ? input.isActive : gradeScale.isActive;

  if (!name) {
    throw new Error("Grade scale name is required.");
  }

  if (!code) {
    throw new Error("Grade scale code is required.");
  }

  validateScoreRange(minScore, maxScore);
  validateDisplayOrder(displayOrder);

  const existingGradeScales = await db.orm.public.GradeScale.where(
    (existingGradeScale) => existingGradeScale.schoolId.eq(schoolId),
  ).all();

  const duplicateCode = existingGradeScales.some(
    (existingGradeScale) =>
      existingGradeScale.id !== gradeScaleId &&
      existingGradeScale.code.toUpperCase() === code,
  );

  if (duplicateCode) {
    throw new Error(`A grade scale with code "${code}" already exists.`);
  }

  await validateNoOverlap(schoolId, minScore, maxScore, gradeScaleId);

  return db.orm.public.GradeScale.where((item) =>
    item.id.eq(gradeScaleId),
  ).update({
    name,
    code,
    minScore,
    maxScore,
    remark,
    displayOrder,
    isActive,
  });
}

/**
 * Delete a grade scale.
 */
export async function deleteGradeScale(schoolId: number, gradeScaleId: number) {
  const gradeScale = await validateGradeScaleOwnership(gradeScaleId, schoolId);

  return db.orm.public.GradeScale.where((item) =>
    item.id.eq(gradeScale.id),
  ).delete();
}

/**
 * Find the grade scale that applies to a score.
 *
 * Example:
 * 75 => A
 * 65 => B
 * 55 => C
 */
export async function getGradeForScore(schoolId: number, score: number) {
  if (!Number.isFinite(score)) {
    throw new Error("Score must be a valid number.");
  }

  if (score < 0 || score > 100) {
    throw new Error("Score must be between 0 and 100.");
  }

  const gradeScales = await getActiveGradeScales(schoolId);

  const matchingGrade = gradeScales.find(
    (gradeScale) =>
      score >= gradeScale.minScore && score <= gradeScale.maxScore,
  );

  if (!matchingGrade) {
    throw new Error(`No active grade scale covers the score ${score}.`);
  }

  return matchingGrade;
}

/**
 * Check whether the school's active grade scales
 * provide complete coverage from 0 to 100.
 */
export async function validateGradeScaleCoverage(schoolId: number) {
  const gradeScales = await getActiveGradeScales(schoolId);

  if (gradeScales.length === 0) {
    throw new Error("The school does not have any active grade scales.");
  }

  const sortedScales = [...gradeScales].sort((a, b) => a.minScore - b.minScore);

  if (sortedScales[0].minScore > 0) {
    throw new Error("Grade scale coverage must start at 0.");
  }

  for (let index = 1; index < sortedScales.length; index += 1) {
    const previous = sortedScales[index - 1];
    const current = sortedScales[index];

    if (current.minScore > previous.maxScore + 1) {
      throw new Error(
        `There is a gap between ${previous.code} and ${current.code}.`,
      );
    }
  }

  const lastScale = sortedScales[sortedScales.length - 1];

  if (lastScale.maxScore < 100) {
    throw new Error("Grade scale coverage must extend to 100.");
  }

  return true;
}
