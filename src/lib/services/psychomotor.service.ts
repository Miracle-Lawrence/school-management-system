import { db } from "@/prisma/db";

import type {
  PsychomotorFieldInput,
  PsychomotorRatingOptionInput,
  StudentPsychomotorRatingInput,
} from "@/lib/validation/psychomotor";

/**
 * ---------------------------------------------------------------------------
 * Psychomotor Fields
 * ---------------------------------------------------------------------------
 */

export async function getPsychomotorFields(schoolId: number) {
  const fields = await db.orm.public.PsychomotorField.where((field) =>
    field.schoolId.eq(schoolId),
  ).all();

  return fields.sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }

    return a.name.localeCompare(b.name);
  });
}

export async function getActivePsychomotorFields(schoolId: number) {
  const fields = await getPsychomotorFields(schoolId);

  return fields.filter((field) => field.isActive);
}

export async function getPsychomotorField(schoolId: number, fieldId: number) {
  const field = await db.orm.public.PsychomotorField.where((field) =>
    field.id.eq(fieldId),
  ).first();

  if (!field || field.schoolId !== schoolId) {
    return null;
  }

  return field;
}

export async function createPsychomotorField(
  schoolId: number,
  input: PsychomotorFieldInput,
) {
  const existingFields = await getPsychomotorFields(schoolId);

  const duplicate = existingFields.some(
    (field) =>
      field.name.trim().toLowerCase() === input.name.trim().toLowerCase(),
  );

  if (duplicate) {
    throw new Error("A psychomotor field with this name already exists.");
  }

  return db.orm.public.PsychomotorField.create({
    schoolId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    displayOrder: input.displayOrder,
    isActive: input.isActive ?? true,
  });
}

export async function updatePsychomotorField(
  schoolId: number,
  fieldId: number,
  input: PsychomotorFieldInput,
) {
  const field = await getPsychomotorField(schoolId, fieldId);

  if (!field) {
    throw new Error("Psychomotor field not found.");
  }

  const existingFields = await getPsychomotorFields(schoolId);

  const duplicate = existingFields.some(
    (item) =>
      item.id !== fieldId &&
      item.name.trim().toLowerCase() === input.name.trim().toLowerCase(),
  );

  if (duplicate) {
    throw new Error("A psychomotor field with this name already exists.");
  }

  return db.orm.public.PsychomotorField.where((item) =>
    item.id.eq(fieldId),
  ).update({
    name: input.name.trim(),
    description: input.description?.trim() || null,
    displayOrder: input.displayOrder,
    isActive: input.isActive ?? true,
  });
}

export async function deletePsychomotorField(
  schoolId: number,
  fieldId: number,
) {
  const field = await getPsychomotorField(schoolId, fieldId);

  if (!field) {
    throw new Error("Psychomotor field not found.");
  }

  const ratings = await db.orm.public.StudentPsychomotorRating.where((rating) =>
    rating.fieldId.eq(fieldId),
  ).all();

  const schoolRatings = ratings.filter(
    (rating) => rating.schoolId === schoolId,
  );

  if (schoolRatings.length > 0) {
    throw new Error(
      "This psychomotor field has student ratings and cannot be deleted. Deactivate it instead.",
    );
  }

  return db.orm.public.PsychomotorField.where((item) =>
    item.id.eq(fieldId),
  ).delete();
}

/**
 * ---------------------------------------------------------------------------
 * Rating Options
 * ---------------------------------------------------------------------------
 */

export async function getPsychomotorRatingOptions(schoolId: number) {
  const options = await db.orm.public.PsychomotorRatingOption.where((option) =>
    option.schoolId.eq(schoolId),
  ).all();

  return options.sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }

    return a.value.localeCompare(b.value);
  });
}

export async function getActivePsychomotorRatingOptions(schoolId: number) {
  const options = await getPsychomotorRatingOptions(schoolId);

  return options.filter((option) => option.isActive);
}

export async function getPsychomotorRatingOption(
  schoolId: number,
  ratingId: number,
) {
  const option = await db.orm.public.PsychomotorRatingOption.where((rating) =>
    rating.id.eq(ratingId),
  ).first();

  if (!option || option.schoolId !== schoolId) {
    return null;
  }

  return option;
}

export async function createPsychomotorRatingOption(
  schoolId: number,
  input: PsychomotorRatingOptionInput,
) {
  const options = await getPsychomotorRatingOptions(schoolId);

  const duplicate = options.some(
    (option) =>
      option.value.trim().toLowerCase() === input.value.trim().toLowerCase(),
  );

  if (duplicate) {
    throw new Error("A rating option with this value already exists.");
  }

  return db.orm.public.PsychomotorRatingOption.create({
    schoolId,
    label: input.label.trim(),
    value: input.value.trim(),
    displayOrder: input.displayOrder,
    isActive: input.isActive ?? true,
  });
}

export async function updatePsychomotorRatingOption(
  schoolId: number,
  ratingId: number,
  input: PsychomotorRatingOptionInput,
) {
  const option = await getPsychomotorRatingOption(schoolId, ratingId);

  if (!option) {
    throw new Error("Psychomotor rating option not found.");
  }

  const options = await getPsychomotorRatingOptions(schoolId);

  const duplicate = options.some(
    (item) =>
      item.id !== ratingId &&
      item.value.trim().toLowerCase() === input.value.trim().toLowerCase(),
  );

  if (duplicate) {
    throw new Error("A rating option with this value already exists.");
  }

  return db.orm.public.PsychomotorRatingOption.where((item) =>
    item.id.eq(ratingId),
  ).update({
    label: input.label.trim(),
    value: input.value.trim(),
    displayOrder: input.displayOrder,
    isActive: input.isActive ?? true,
  });
}

export async function deletePsychomotorRatingOption(
  schoolId: number,
  ratingId: number,
) {
  const option = await getPsychomotorRatingOption(schoolId, ratingId);

  if (!option) {
    throw new Error("Psychomotor rating option not found.");
  }

  const ratings = await db.orm.public.StudentPsychomotorRating.where((rating) =>
    rating.ratingId.eq(ratingId),
  ).all();

  const schoolRatings = ratings.filter(
    (rating) => rating.schoolId === schoolId,
  );

  if (schoolRatings.length > 0) {
    throw new Error(
      "This rating option has been used by students and cannot be deleted. Deactivate it instead.",
    );
  }

  return db.orm.public.PsychomotorRatingOption.where((item) =>
    item.id.eq(ratingId),
  ).delete();
}

/**
 * ---------------------------------------------------------------------------
 * Student Ratings
 * ---------------------------------------------------------------------------
 */

export async function getStudentPsychomotorRatings(
  schoolId: number,
  studentId: number,
  termId: number,
) {
  const ratings = await db.orm.public.StudentPsychomotorRating.where((rating) =>
    rating.studentId.eq(studentId),
  ).all();

  return ratings.filter(
    (rating) => rating.schoolId === schoolId && rating.termId === termId,
  );
}

export async function getStudentPsychomotorRating(
  schoolId: number,
  studentId: number,
  termId: number,
  fieldId: number,
) {
  const ratings = await getStudentPsychomotorRatings(
    schoolId,
    studentId,
    termId,
  );

  return ratings.find((rating) => rating.fieldId === fieldId) ?? null;
}

export async function saveStudentPsychomotorRating(
  schoolId: number,
  input: StudentPsychomotorRatingInput,
) {
  const student = await db.orm.public.Student.where((student) =>
    student.id.eq(input.studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    throw new Error("Student not found.");
  }

  const field = await getPsychomotorField(schoolId, input.fieldId);

  if (!field) {
    throw new Error("Psychomotor field not found.");
  }

  const ratingOption = await getPsychomotorRatingOption(
    schoolId,
    input.ratingId,
  );

  if (!ratingOption) {
    throw new Error("Psychomotor rating option not found.");
  }

  const existingRatings = await getStudentPsychomotorRatings(
    schoolId,
    input.studentId,
    input.termId,
  );

  const existing = existingRatings.find(
    (rating) => rating.fieldId === input.fieldId,
  );

  if (existing) {
    return db.orm.public.StudentPsychomotorRating.where((rating) =>
      rating.id.eq(existing.id),
    ).update({
      ratingId: input.ratingId,
      comment: input.comment?.trim() || null,
    });
  }

  return db.orm.public.StudentPsychomotorRating.create({
    schoolId,
    studentId: input.studentId,
    termId: input.termId,
    fieldId: input.fieldId,
    ratingId: input.ratingId,
    comment: input.comment?.trim() || null,
  });
}

export async function deleteStudentPsychomotorRating(
  schoolId: number,
  ratingId: number,
) {
  const rating = await db.orm.public.StudentPsychomotorRating.where((item) =>
    item.id.eq(ratingId),
  ).first();

  if (!rating || rating.schoolId !== schoolId) {
    throw new Error("Student psychomotor rating not found.");
  }

  return db.orm.public.StudentPsychomotorRating.where((item) =>
    item.id.eq(ratingId),
  ).delete();
}
