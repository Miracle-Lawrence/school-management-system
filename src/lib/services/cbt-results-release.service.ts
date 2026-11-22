import { db } from "@/prisma/db";
import { assertCBTClassSubjectAccess } from "./cbt-authorization.service";

type ReleaseCBTResultsInput = {
  schoolId: number;
  userId: number;
  role: string;
  assessmentId: number;
};

export async function releaseCBTResults(
  input: ReleaseCBTResultsInput,
) {
  const { schoolId, userId, role, assessmentId } = input;

  if (
    !Number.isSafeInteger(schoolId) || schoolId <= 0 ||
    !Number.isSafeInteger(userId) || userId <= 0 ||
    !Number.isSafeInteger(assessmentId) || assessmentId <= 0
  ) {
    throw new Error("Invalid CBT results release details.");
  }

  const assessment = await db.orm.public.Assessment.where((item) =>
    item.id.eq(assessmentId),
  ).first();

  if (!assessment || assessment.schoolId !== schoolId) {
    throw new Error("Assessment not found.");
  }

  await assertCBTClassSubjectAccess({
    schoolId,
    userId,
    role,
    classId: assessment.classId,
    subjectId: assessment.subjectId,
  });

  const settings = await db.orm.public.CBTExamSettings.where((item) =>
    item.assessmentId.eq(assessmentId),
  ).first();

  if (!settings) {
    throw new Error("CBT settings were not found.");
  }

  if (settings.resultsReleasedAt) {
    throw new Error("Results have already been released for this assessment.");
  }

  const now = globalThis.Temporal.Now.instant();

  const closingTimePassed =
    !!settings.closesAt &&
    globalThis.Temporal.Instant.compare(
      now,
      globalThis.Temporal.Instant.from(settings.closesAt),
    ) >= 0;

  const isClosed =
    settings.status === "CLOSED" ||
    settings.status === "ARCHIVED" ||
    closingTimePassed;

  if (!isClosed) {
    throw new Error(
      "Close the CBT assessment before releasing its results.",
    );
  }

  const attempts = await db.orm.public.CBTExamAttempt.where((item) =>
    item.assessmentId.eq(assessmentId),
  ).all();

  const incompleteAttempts = attempts.filter(
    (attempt) =>
      attempt.status !== "VOIDED" &&
      attempt.status !== "GRADED" &&
      attempt.status !== "AUTO_SUBMITTED",
  );

  if (incompleteAttempts.length > 0) {
    const markingCount = incompleteAttempts.filter(
      (attempt) => attempt.status === "MARKING",
    ).length;

    const inProgressCount = incompleteAttempts.filter(
      (attempt) => attempt.status === "IN_PROGRESS",
    ).length;

    const submittedCount = incompleteAttempts.filter(
      (attempt) => attempt.status === "SUBMITTED",
    ).length;

    throw new Error(
      `Results cannot be released yet. ${incompleteAttempts.length} attempt(s) remain incomplete: ${markingCount} awaiting manual marking, ${inProgressCount} still in progress, and ${submittedCount} awaiting grading.`,
    );
  }

  const releasedAt = now.toString();

  await db.orm.public.CBTExamSettings.where((item) =>
    item.id.eq(settings.id),
  ).update({
    resultsReleasedAt: releasedAt,
  });

  return {
    assessmentId,
    resultsReleasedAt: releasedAt,
    released: true,
  };
}
