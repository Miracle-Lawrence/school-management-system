import { db } from "@/prisma/db";

type GetStudentCBTAssessmentsInput = {
  userId: number;
  schoolId: number;
};

export async function getStudentCBTAssessments(
  input: GetStudentCBTAssessmentsInput,
) {
  const { userId, schoolId } = input;

  if (
    !Number.isSafeInteger(userId) || userId <= 0 ||
    !Number.isSafeInteger(schoolId) || schoolId <= 0
  ) {
    throw new Error("Invalid student details.");
  }

  const student = await db.orm.public.Student.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!student || student.schoolId !== schoolId || !student.isActive) {
    throw new Error("No active student profile was found.");
  }

  if (!student.classId) {
    throw new Error("You are not assigned to a class.");
  }

  const now = globalThis.Temporal.Now.instant();

  const assessments = await db.orm.public.Assessment.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const classAssessments = assessments.filter(
    (assessment) => assessment.classId === student.classId,
  );

  const studentAttempts = await db.orm.public.CBTExamAttempt.where((item) =>
    item.studentId.eq(student.id),
  ).all();

  const results = [];

  for (const assessment of classAssessments) {
    const settings = await db.orm.public.CBTExamSettings.where((item) =>
      item.assessmentId.eq(assessment.id),
    ).first();

    if (!settings) {
      continue;
    }

    const opensAt = settings.opensAt
      ? globalThis.Temporal.Instant.from(settings.opensAt)
      : null;

    const closesAt = settings.closesAt
      ? globalThis.Temporal.Instant.from(settings.closesAt)
      : null;

    const hasOpened =
      !opensAt ||
      globalThis.Temporal.Instant.compare(now, opensAt) >= 0;

    const hasClosed =
      !!closesAt &&
      globalThis.Temporal.Instant.compare(now, closesAt) >= 0;

    const attempts = studentAttempts
      .filter((attempt) => attempt.assessmentId === assessment.id)
      .sort((a, b) => b.attemptNumber - a.attemptNumber);

    const validAttempts = attempts.filter(
      (attempt) => attempt.status !== "VOIDED",
    );

    const inProgressAttempt = attempts.find(
      (attempt) => attempt.status === "IN_PROGRESS",
    );

    const hasUnfinishedAttempt = !!inProgressAttempt;

    const isPublished =
      settings.status === "PUBLISHED" ||
      (settings.status === "SCHEDULED" && hasOpened);

    if (!isPublished && !hasUnfinishedAttempt) {
      continue;
    }

    const attemptExpired =
      !!inProgressAttempt &&
      globalThis.Temporal.Instant.compare(
        now,
        globalThis.Temporal.Instant.from(inProgressAttempt.deadlineAt),
      ) >= 0;

    const canStartNewAttempt =
      isPublished &&
      hasOpened &&
      !hasClosed &&
      !hasUnfinishedAttempt &&
      validAttempts.length < settings.maxAttempts;

    const questions = await db.orm.public.CBTExamQuestion.where((item) =>
      item.assessmentId.eq(assessment.id),
    ).all();

    if (questions.length === 0) {
      continue;
    }

    results.push({
      assessmentId: assessment.id,
      title: assessment.title,
      subjectId: assessment.subjectId,
      assessmentType: assessment.type,
      maxScore: assessment.maxScore,
      description: assessment.description,
      durationMinutes: settings.durationMinutes,
      opensAt: settings.opensAt,
      closesAt: settings.closesAt,
      maxAttempts: settings.maxAttempts,
      attemptsUsed: validAttempts.length,
      remainingAttempts: Math.max(
        0,
        settings.maxAttempts - validAttempts.length,
      ),
      questionCount: questions.length,
      status: settings.status === "SCHEDULED" ? "PUBLISHED" : settings.status,
      canStart: canStartNewAttempt,
      hasUnfinishedAttempt,
      attemptExpired,
      currentAttempt: inProgressAttempt
        ? {
            id: inProgressAttempt.id,
            attemptNumber: inProgressAttempt.attemptNumber,
            status: inProgressAttempt.status,
            startedAt: inProgressAttempt.startedAt,
            deadlineAt: inProgressAttempt.deadlineAt,
          }
        : null,
      resultsReleased: !!settings.resultsReleasedAt,
      latestAttempt: attempts[0]
        ? {
            id: attempts[0].id,
            attemptNumber: attempts[0].attemptNumber,
            status: attempts[0].status,
            submittedAt: attempts[0].submittedAt,
            score: settings.resultsReleasedAt ? attempts[0].score : null,
            maxScore: settings.resultsReleasedAt ? attempts[0].maxScore : null,
          }
        : null,
    });
  }

  return results.sort((a, b) => {
    const aDate = a.opensAt
      ? globalThis.Temporal.Instant.from(a.opensAt).epochMilliseconds
      : 0;

    const bDate = b.opensAt
      ? globalThis.Temporal.Instant.from(b.opensAt).epochMilliseconds
      : 0;

    return bDate - aDate;
  });
}

