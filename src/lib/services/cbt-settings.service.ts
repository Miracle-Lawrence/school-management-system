import { db } from "@/prisma/db";
import { assertCBTClassSubjectAccess } from "./cbt-authorization.service";

type CBTUserContext = {
  schoolId: number;
  userId: number;
  role: string;
};

type CBTReportMode = "AUTOMATIC" | "MANUAL" | "EXCLUDED";

type CreateCBTSettingsInput = CBTUserContext & {
  assessmentId: number;
  activityTypeId?: number | null;
  reportMode?: CBTReportMode;
  durationMinutes: number;
  opensAt?: string | null;
  closesAt?: string | null;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  allowBackNavigation?: boolean;
  instructions?: string | null;
};

type GetCBTSettingsInput = CBTUserContext & {
  assessmentId: number;
};

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

function validateSchedule(opensAt?: string | null, closesAt?: string | null) {
  const parseDate = (value?: string | null): Date | null => {
    if (!value) return null;

    const match =
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|([+-])(\d{2}):(\d{2}))$/i.exec(value);

    if (!match) {
      throw new Error("Dates must be valid ISO 8601 timestamps with a timezone.");
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    const second = Number(match[6] ?? 0);
    const offsetHour = Number(match[9] ?? 0);
    const offsetMinute = Number(match[10] ?? 0);

    const daysInMonth = [
      31,
      (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28,
      31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
    ];

    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > daysInMonth[month - 1] ||
      hour > 23 ||
      minute > 59 ||
      second > 59 ||
      offsetHour > 14 ||
      offsetMinute > 59 ||
      (offsetHour === 14 && offsetMinute !== 0)
    ) {
      throw new Error("Invalid CBT opening or closing date.");
    }

    const timestamp = Date.parse(value);

    if (!Number.isFinite(timestamp)) {
      throw new Error("Invalid CBT opening or closing date.");
    }

    return new Date(timestamp);
  };

  const opening = parseDate(opensAt);
  const closing = parseDate(closesAt);

  if (opening && closing && opening.getTime() >= closing.getTime()) {
    throw new Error("The closing date must be after the opening date.");
  }

  return { opening, closing };
}

async function getAuthorizedAssessment(input: CBTUserContext & {
  assessmentId: number;
}) {
  validateContext(input);

  if (!Number.isSafeInteger(input.assessmentId) || input.assessmentId <= 0) {
    throw new Error("Invalid assessment.");
  }

  const assessment = await db.orm.public.Assessment.where((item) =>
    item.id.eq(input.assessmentId),
  ).first();

  if (!assessment || assessment.schoolId !== input.schoolId) {
    throw new Error("Assessment not found.");
  }

  await assertCBTClassSubjectAccess({
    schoolId: input.schoolId,
    userId: input.userId,
    role: input.role,
    classId: assessment.classId,
    subjectId: assessment.subjectId,
  });

  return assessment;
}

export async function getCBTSettings(input: GetCBTSettingsInput) {
  await getAuthorizedAssessment(input);

  return db.orm.public.CBTExamSettings.where((item) =>
    item.assessmentId.eq(input.assessmentId),
  ).first();
}

export async function createCBTSettings(input: CreateCBTSettingsInput) {
  const assessment = await getAuthorizedAssessment(input);

  if (
    !Number.isInteger(input.durationMinutes) ||
    input.durationMinutes < 1 ||
    input.durationMinutes > 600
  ) {
    throw new Error("Duration must be between 1 and 600 minutes.");
  }

  const maxAttempts = input.maxAttempts ?? 1;

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) {
    throw new Error("Maximum attempts must be between 1 and 20.");
  }

  const reportMode = input.reportMode ?? "EXCLUDED";

  if (!["AUTOMATIC", "MANUAL", "EXCLUDED"].includes(reportMode)) {
    throw new Error("Invalid CBT report mode.");
  }

  const { opening, closing } = validateSchedule(
    input.opensAt,
    input.closesAt,
  );

  const existing = await db.orm.public.CBTExamSettings.where((item) =>
    item.assessmentId.eq(input.assessmentId),
  ).first();

  if (existing) {
    throw new Error("CBT settings already exist for this assessment.");
  }

  if (input.activityTypeId != null) {
    if (
      !Number.isSafeInteger(input.activityTypeId) ||
      input.activityTypeId <= 0
    ) {
      throw new Error("Invalid CBT activity type.");
    }

    const activityType = await db.orm.public.CBTActivityType.where((item) =>
      item.id.eq(input.activityTypeId!),
    ).first();

    if (
      !activityType ||
      activityType.schoolId !== input.schoolId ||
      !activityType.isActive
    ) {
      throw new Error("Active CBT activity type not found for this school.");
    }
  }

  if (reportMode === "AUTOMATIC") {
    if (!assessment.assessmentCategoryId) {
      throw new Error(
        "Automatic report integration requires an assessment category.",
      );
    }

    const category = await db.orm.public.AssessmentCategory.where((item) =>
      item.id.eq(assessment.assessmentCategoryId!),
    ).first();

    if (
      !category ||
      category.schoolId !== input.schoolId ||
      !category.isActive ||
      category.type !== assessment.type
    ) {
      throw new Error(
        "The assessment must have an active, matching assessment category for automatic report integration.",
      );
    }
  }

  const instructions = input.instructions?.trim() || null;

  if (instructions && instructions.length > 10000) {
    throw new Error("Instructions must not exceed 10,000 characters.");
  }

  return db.orm.public.CBTExamSettings.create({
    assessmentId: input.assessmentId,
    activityTypeId: input.activityTypeId ?? null,
    reportMode,
    status: "DRAFT",
    durationMinutes: input.durationMinutes,
    opensAt: opening?.toString() ?? null,
    closesAt: closing?.toString() ?? null,
    maxAttempts,
    shuffleQuestions: input.shuffleQuestions ?? false,
    shuffleOptions: input.shuffleOptions ?? false,
    allowBackNavigation: input.allowBackNavigation ?? true,
    instructions,
  });
}

type UpdateCBTSettingsInput = CBTUserContext & {
  assessmentId: number;
  activityTypeId?: number | null;
  reportMode?: CBTReportMode;
  durationMinutes?: number;
  opensAt?: string | null;
  closesAt?: string | null;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  allowBackNavigation?: boolean;
  instructions?: string | null;
};

export async function updateCBTSettings(input: UpdateCBTSettingsInput) {
  const assessment = await getAuthorizedAssessment(input);

  const settings = await db.orm.public.CBTExamSettings.where((item) =>
    item.assessmentId.eq(input.assessmentId),
  ).first();

  if (!settings) {
    throw new Error("CBT settings have not been configured.");
  }

  if (settings.status !== "DRAFT") {
    throw new Error("Only CBT assessments in DRAFT status can be edited.");
  }

  const [questions, attempts] = await Promise.all([
    db.orm.public.CBTExamQuestion.where((item) =>
      item.assessmentId.eq(input.assessmentId),
    ).all(),
    db.orm.public.CBTExamAttempt.where((item) =>
      item.assessmentId.eq(input.assessmentId),
    ).all(),
  ]);

  if (questions.length > 0 || attempts.length > 0) {
    throw new Error(
      "CBT settings cannot be changed after questions have been published or student attempts have been created.",
    );
  }

  const durationMinutes =
    input.durationMinutes ?? settings.durationMinutes;

  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 600
  ) {
    throw new Error("Duration must be between 1 and 600 minutes.");
  }

  const maxAttempts = input.maxAttempts ?? settings.maxAttempts;

  if (
    !Number.isInteger(maxAttempts) ||
    maxAttempts < 1 ||
    maxAttempts > 20
  ) {
    throw new Error("Maximum attempts must be between 1 and 20.");
  }

  const reportMode = input.reportMode ?? settings.reportMode;

  if (!["AUTOMATIC", "MANUAL", "EXCLUDED"].includes(reportMode)) {
    throw new Error("Invalid CBT report mode.");
  }

  const activityTypeId =
    input.activityTypeId === undefined
      ? settings.activityTypeId
      : input.activityTypeId;

  if (input.activityTypeId !== undefined && activityTypeId !== null) {
    if (
      !Number.isSafeInteger(activityTypeId) ||
      activityTypeId <= 0
    ) {
      throw new Error("Invalid CBT activity type.");
    }

    const activityType = await db.orm.public.CBTActivityType.where((item) =>
      item.id.eq(activityTypeId),
    ).first();

    if (
      !activityType ||
      activityType.schoolId !== input.schoolId ||
      !activityType.isActive
    ) {
      throw new Error("Active CBT activity type not found for this school.");
    }
  }

  if (reportMode === "AUTOMATIC") {
    if (!assessment.assessmentCategoryId) {
      throw new Error(
        "Automatic report integration requires an assessment category.",
      );
    }

    const category = await db.orm.public.AssessmentCategory.where((item) =>
      item.id.eq(assessment.assessmentCategoryId!),
    ).first();

    if (
      !category ||
      category.schoolId !== input.schoolId ||
      !category.isActive ||
      category.type !== assessment.type
    ) {
      throw new Error(
        "The assessment must have an active, matching assessment category for automatic report integration.",
      );
    }
  }

  const opensAt =
    input.opensAt === undefined ? settings.opensAt : input.opensAt;

  const closesAt =
    input.closesAt === undefined ? settings.closesAt : input.closesAt;

  const { opening, closing } = validateSchedule(opensAt, closesAt);

  const instructions =
    input.instructions === undefined
      ? settings.instructions
      : input.instructions?.trim() || null;

  if (instructions && instructions.length > 10000) {
    throw new Error("Instructions must not exceed 10,000 characters.");
  }

  return db.orm.public.CBTExamSettings.where((item) =>
    item.id.eq(settings.id),
  ).update({
    activityTypeId,
    reportMode,
    durationMinutes,
    opensAt: opening?.toString() ?? null,
    closesAt: closing?.toString() ?? null,
    maxAttempts,
    shuffleQuestions:
      input.shuffleQuestions ?? settings.shuffleQuestions,
    shuffleOptions:
      input.shuffleOptions ?? settings.shuffleOptions,
    allowBackNavigation:
      input.allowBackNavigation ?? settings.allowBackNavigation,
    instructions,
  });
}

