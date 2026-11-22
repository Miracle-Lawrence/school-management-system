import { db } from "@/prisma/db";
import { assertCBTClassSubjectAccess } from "./cbt-authorization.service";

type GetCBTAssessmentResultsInput = {
  schoolId: number;
  userId: number;
  role: string;
  assessmentId: number;
};

export async function getCBTAssessmentResults(
  input: GetCBTAssessmentResultsInput,
) {
  const { schoolId, userId, role, assessmentId } = input;

  if (
    !Number.isSafeInteger(schoolId) || schoolId <= 0 ||
    !Number.isSafeInteger(userId) || userId <= 0 ||
    !Number.isSafeInteger(assessmentId) || assessmentId <= 0
  ) {
    throw new Error("Invalid CBT results request.");
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
    throw new Error("CBT settings were not found for this assessment.");
  }

  const attempts = await db.orm.public.CBTExamAttempt.where((item) =>
    item.assessmentId.eq(assessmentId),
  ).all();

  const questions = await db.orm.public.CBTExamQuestion.where((item) =>
    item.assessmentId.eq(assessmentId),
  ).all();

  const results = [];

  for (const attempt of attempts) {
    const student = await db.orm.public.Student.where((item) =>
      item.id.eq(attempt.studentId),
    ).first();

    if (!student || student.schoolId !== schoolId) {
      continue;
    }

    const responses = await db.orm.public.CBTExamResponse.where((item) =>
      item.attemptId.eq(attempt.id),
    ).all();

    const attemptResponses = [];

    for (const response of responses) {
      const question = questions.find(
        (item) => item.id === response.examQuestionId,
      );

      if (!question) {
        continue;
      }

      const options = await db.orm.public.CBTExamOption.where((item) =>
        item.examQuestionId.eq(question.id),
      ).all();

      const selectedResponseOptions =
        await db.orm.public.CBTExamResponseOption.where((item) =>
          item.responseId.eq(response.id),
        ).all();

      const selectedOptionIds = new Set(
        selectedResponseOptions.map((item) => item.examOptionId),
      );

      attemptResponses.push({
        responseId: response.id,
        questionId: question.id,
        type: question.type,
        prompt: question.prompt,
        explanation: question.explanation,
        marks: question.marks,
        displayOrder: question.displayOrder,
        answerText: response.answerText,
        awardedMarks: response.awardedMarks,
        isCorrect: response.isCorrect,
        markingStatus: response.markingStatus,
        feedback: response.feedback,
        markedAt: response.markedAt,
        options: options
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((option) => ({
            id: option.id,
            text: option.text,
            isCorrect: option.isCorrect,
            displayOrder: option.displayOrder,
            selected: selectedOptionIds.has(option.id),
          })),
      });
    }

    attemptResponses.sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );

    attemptResponses.forEach((response) => {
      response.options.sort(
        (a, b) => a.displayOrder - b.displayOrder,
      );
    });

    results.push({
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      startedAt: attempt.startedAt,
      deadlineAt: attempt.deadlineAt,
      submittedAt: attempt.submittedAt,
      score: attempt.score,
      maxScore: attempt.maxScore,
      autoSubmitted: attempt.autoSubmitted,
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        photoUrl: student.photoUrl,
      },
      responses: attemptResponses,
      pendingTheoryCount: attemptResponses.filter(
        (response) =>
          response.type === "THEORY" &&
          response.markingStatus === "PENDING",
      ).length,
    });
  }

  results.sort((a, b) => {
    const nameA =
      `${a.student.lastName} ${a.student.firstName}`.toLowerCase();
    const nameB =
      `${b.student.lastName} ${b.student.firstName}`.toLowerCase();

    return (
      nameA.localeCompare(nameB) ||
      a.attemptNumber - b.attemptNumber
    );
  });

  const validAttempts = results.filter(
    (attempt) => attempt.status !== "VOIDED",
  );

  return {
    assessment: {
      id: assessment.id,
      title: assessment.title,
      classId: assessment.classId,
      subjectId: assessment.subjectId,
      maxScore: assessment.maxScore,
      type: assessment.type,
    },
    settings: {
      status: settings.status,
      reportMode: settings.reportMode,
      resultsReleasedAt: settings.resultsReleasedAt,
      resultsReleased: !!settings.resultsReleasedAt,
      opensAt: settings.opensAt,
      closesAt: settings.closesAt,
    },
    summary: {
      totalAttempts: validAttempts.length,
      completedAttempts: validAttempts.filter(
        (attempt) =>
          attempt.status === "GRADED" ||
          attempt.status === "AUTO_SUBMITTED",
      ).length,
      inProgressAttempts: validAttempts.filter(
        (attempt) => attempt.status === "IN_PROGRESS",
      ).length,
      awaitingMarking: validAttempts.filter(
        (attempt) => attempt.status === "MARKING",
      ).length,
      voidedAttempts: results.length - validAttempts.length,
      pendingTheoryResponses: validAttempts.reduce(
        (total, attempt) => total + attempt.pendingTheoryCount,
        0,
      ),
    },
    attempts: results,
  };
}
