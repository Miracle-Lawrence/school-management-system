import { db } from "@/prisma/db";

type CBTUserContext = {
  schoolId: number;
  userId: number;
  role: string;
};

type CreateCBTActivityTypeInput = CBTUserContext & {
  name: string;
  description?: string;
};

type UpdateCBTActivityTypeInput = CBTUserContext & {
  activityTypeId: number;
  name?: string;
  description?: string | null;
  isActive?: boolean;
};

type GetCBTActivityTypesInput = CBTUserContext & {
  includeInactive?: boolean;
};

const ADMIN_ROLES = ["SCHOOL_OWNER", "SCHOOL_ADMIN"];

function validateContext(input: CBTUserContext): void {
  if (
    !Number.isSafeInteger(input.schoolId) ||
    input.schoolId <= 0 ||
    !Number.isSafeInteger(input.userId) ||
    input.userId <= 0
  ) {
    throw new Error("Invalid CBT authorization context.");
  }
}

function assertAdmin(input: CBTUserContext): void {
  validateContext(input);

  if (!ADMIN_ROLES.includes(input.role)) {
    throw new Error(
      "Only school owners and school admins can manage CBT activity types.",
    );
  }
}

function validateName(name: string): string {
  const normalized = name.trim();

  if (normalized.length < 2 || normalized.length > 100) {
    throw new Error("Activity type name must be between 2 and 100 characters.");
  }

  return normalized;
}

async function ensureUniqueName(
  schoolId: number,
  name: string,
  excludeId?: number,
) {
  const types = await db.orm.public.CBTActivityType.where((type) =>
    type.schoolId.eq(schoolId),
  ).all();

  const duplicate = types.some(
    (type) =>
      type.id !== excludeId &&
      type.name.toLowerCase() === name.toLowerCase(),
  );

  if (duplicate) {
    throw new Error("An activity type with this name already exists.");
  }
}

export async function getCBTActivityTypes(
  input: GetCBTActivityTypesInput,
) {
  validateContext(input);

  if (
    !ADMIN_ROLES.includes(input.role) &&
    input.role !== "TEACHER"
  ) {
    throw new Error("You are not authorized to view CBT activity types.");
  }

  const types = await db.orm.public.CBTActivityType.where((type) =>
    type.schoolId.eq(input.schoolId),
  ).all();

  // Teachers can only see active activity types.
  const includeInactive =
    ADMIN_ROLES.includes(input.role) && (input.includeInactive ?? false);

  return types
    .filter((type) => includeInactive || type.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createCBTActivityType(
  input: CreateCBTActivityTypeInput,
) {
  assertAdmin(input);

  const name = validateName(input.name);
  const description = input.description?.trim() || null;

  await ensureUniqueName(input.schoolId, name);

  return db.orm.public.CBTActivityType.create({
    schoolId: input.schoolId,
    name,
    description,
    isActive: true,
  });
}

export async function updateCBTActivityType(
  input: UpdateCBTActivityTypeInput,
) {
  assertAdmin(input);

  if (
    !Number.isSafeInteger(input.activityTypeId) ||
    input.activityTypeId <= 0
  ) {
    throw new Error("Invalid CBT activity type.");
  }

  const existing = await db.orm.public.CBTActivityType.where((type) =>
    type.id.eq(input.activityTypeId),
  ).first();

  if (!existing || existing.schoolId !== input.schoolId) {
    throw new Error("CBT activity type not found.");
  }

  const name =
    input.name === undefined ? existing.name : validateName(input.name);

  if (input.name !== undefined) {
    await ensureUniqueName(input.schoolId, name, existing.id);
  }

  return db.orm.public.CBTActivityType.where((type) =>
    type.id.eq(existing.id),
  ).update({
    name,
    description:
      input.description === undefined
        ? existing.description
        : input.description?.trim() || null,
    isActive: input.isActive ?? existing.isActive,
  });
}

export async function deactivateCBTActivityType(
  input: CBTUserContext & {
    activityTypeId: number;
  },
) {
  assertAdmin(input);

  if (
    !Number.isSafeInteger(input.activityTypeId) ||
    input.activityTypeId <= 0
  ) {
    throw new Error("Invalid CBT activity type.");
  }

  const existing = await db.orm.public.CBTActivityType.where((type) =>
    type.id.eq(input.activityTypeId),
  ).first();

  if (!existing || existing.schoolId !== input.schoolId) {
    throw new Error("CBT activity type not found.");
  }

  if (!existing.isActive) {
    return existing;
  }

  return db.orm.public.CBTActivityType.where((type) =>
    type.id.eq(input.activityTypeId),
  ).update({
    isActive: false,
  });
}
