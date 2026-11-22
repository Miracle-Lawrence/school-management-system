import { db } from "@/prisma/db";
import { recordAssessmentScore } from "@/lib/services/assessment.service";

type StartCBTAttemptInput = {
  userId: number;
  schoolId: number;
  assessmentId: number;
};

export async function startCBTAttempt(input: StartCBTAttemptInput) {
  const { userId, schoolId, assessmentId } = input;

  if (
    !Number.isSafeInteger(userId) || userId <= 0 ||
    !Number.isSafeInteger(schoolId) || schoolId <= 0 ||
    !Number.isSafeInteger(assessmentId) || assessmentId <= 0
  ) {
    throw new Error("Invalid attempt details.");
  }

  return db.transaction(async (tx) => {
    const student = await tx.orm.public.Student.where((item) =>
      item.userId.eq(userId),
    ).first();

    if (
      !student ||
      student.schoolId !== schoolId ||
      !student.isActive
    ) {
      throw new Error("No active student profile was found.");
    }

    if (!student.classId) {
      throw new Error("You are not assigned to a class.");
    }

    const assessment = await tx.orm.public.Assessment.where((item) =>
      item.id.eq(assessmentId),
    ).first();

    if (
      !assessment ||
      assessment.schoolId !== schoolId ||
      assessment.classId !== student.classId
    ) {
      throw new Error("Assessment not found or unavailable to this student.");
    }

    const settings = await tx.orm.public.CBTExamSettings.where((item) =>
      item.assessmentId.eq(assessmentId),
    ).first();

    if (!settings) {
      throw new Error("CBT settings were not found.");
    }

    const now = globalThis.Temporal.Now.instant();

    if (settings.status === "SCHEDULED") {
      if (
        settings.opensAt &&
        globalThis.Temporal.Instant.compare(
          now,
          globalThis.Temporal.Instant.from(settings.opensAt),
        ) < 0
      ) {
        throw new Error("This activity has not opened yet.");
      }

      await tx.orm.public.CBTExamSettings.where((item) =>
        item.id.eq(settings.id),
      ).update({
        status: "PUBLISHED",
      });
    } else if (settings.status !== "PUBLISHED") {
      throw new Error("This activity is not available for attempts.");
    }

    if (
      settings.opensAt &&
      globalThis.Temporal.Instant.compare(
        now,
        globalThis.Temporal.Instant.from(settings.opensAt),
      ) < 0
    ) {
      throw new Error("This activity has not opened yet.");
    }


    const questions = await tx.orm.public.CBTExamQuestion.where((item) =>
      item.assessmentId.eq(assessmentId),
    ).all();

    if (questions.length === 0) {
      throw new Error("This activity has no published questions.");
    }

    const assessmentAttempts = await tx.orm.public.CBTExamAttempt.where((item) =>
      item.assessmentId.eq(assessmentId),
    ).all();

    const studentAttempts = assessmentAttempts.filter(
      (attempt) => attempt.studentId === student.id,
    );

    const existingInProgressAttempt = studentAttempts.find(
      (attempt) => attempt.status === "IN_PROGRESS",
    );

    if (existingInProgressAttempt) {
      if (
        globalThis.Temporal.Instant.compare(
          now,
          globalThis.Temporal.Instant.from(existingInProgressAttempt.deadlineAt),
        ) >= 0
      ) {
        throw new Error(
          "Your previous attempt has expired and must be submitted before starting another.",
        );
      }

      return {
        attemptId: existingInProgressAttempt.id,
        attemptNumber: existingInProgressAttempt.attemptNumber,
        status: existingInProgressAttempt.status,
        startedAt: existingInProgressAttempt.startedAt,
        deadlineAt: existingInProgressAttempt.deadlineAt,
        questionCount: questions.length,
        resumed: true,
      };
    }

    if (
      settings.closesAt &&
      globalThis.Temporal.Instant.compare(
        now,
        globalThis.Temporal.Instant.from(settings.closesAt),
      ) >= 0
    ) {
      throw new Error("The activity submission window has closed.");
    }

    const validAttempts = studentAttempts.filter(
      (attempt) => attempt.status !== "VOIDED",
    );

    if (validAttempts.length >= settings.maxAttempts) {
      throw new Error("You have reached the maximum number of attempts.");
    }

    const attemptNumber = assessmentAttempts
      .filter((attempt) => attempt.studentId === student.id)
      .reduce(
        (highest, attempt) => Math.max(highest, attempt.attemptNumber),
        0,
      ) + 1;

    const durationDeadline = now.add({
      minutes: settings.durationMinutes,
    });

    const activityDeadline = settings.closesAt
      ? globalThis.Temporal.Instant.from(settings.closesAt)
      : null;

    const deadline =
      activityDeadline &&
      globalThis.Temporal.Instant.compare(
        activityDeadline,
        durationDeadline,
      ) < 0
        ? activityDeadline
        : durationDeadline;

    if (globalThis.Temporal.Instant.compare(deadline, now) <= 0) {
      throw new Error("There is not enough time remaining to start this activity.");
    }

    const attempt = await tx.orm.public.CBTExamAttempt.create({
      assessmentId,
      studentId: student.id,
      attemptNumber,
      status: "IN_PROGRESS",
      startedAt: now.toString(),
      deadlineAt: deadline.toString(),
      autoSubmitted: false,
    });

    for (const question of questions) {
      await tx.orm.public.CBTExamResponse.create({
        attemptId: attempt.id,
        examQuestionId: question.id,
        markingStatus: "PENDING",
      });
    }

    return {
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      startedAt: attempt.startedAt,
      deadlineAt: attempt.deadlineAt,
      questionCount: questions.length,
    };
  });
}




type GradeCBTAttemptInput = {
  attemptId: number;
  autoSubmitted: boolean;
};

async function gradeCBTAttempt(
  tx: Pick<typeof db, "orm">,
  input: GradeCBTAttemptInput,
) {
  const attempt = await tx.orm.public.CBTExamAttempt.where((item) =>
    item.id.eq(input.attemptId),
  ).first();

  if (!attempt || attempt.status === "VOIDED") {
    throw new Error("A valid CBT attempt was not found.");
  }

  const questions = await tx.orm.public.CBTExamQuestion.where((item) =>
    item.assessmentId.eq(attempt.assessmentId),
  ).all();

  const responses = await tx.orm.public.CBTExamResponse.where((item) =>
    item.attemptId.eq(attempt.id),
  ).all();

  if (questions.length === 0 || responses.length !== questions.length) {
    throw new Error("The attempt responses are incomplete.");
  }

  const now = globalThis.Temporal.Now.instant().toString();
  let score = 0;
  let maxScore = 0;
  let requiresManualMarking = false;

  for (const question of questions) {
    const response = responses.find(
      (item) => item.examQuestionId === question.id,
    );

    if (!response) {
      throw new Error("A question response is missing.");
    }

    maxScore += question.marks;

    if (question.type === "THEORY") {
      if (response.answerText?.trim()) {
        requiresManualMarking = true;
      } else {
        await tx.orm.public.CBTExamResponse.where((item) =>
          item.id.eq(response.id),
        ).update({
          awardedMarks: 0,
          isCorrect: false,
          markingStatus: "AUTO_MARKED",
          markedAt: now,
        });
      }

      if (!response.answerText?.trim()) {
        continue;
      }

      continue;
    }

    const selectedRows =
      await tx.orm.public.CBTExamResponseOption.where((item) =>
        item.responseId.eq(response.id),
      ).all();

    const selectedIds = selectedRows
      .map((item) => item.examOptionId)
      .sort((a, b) => a - b);

    const options = await tx.orm.public.CBTExamOption.where((item) =>
      item.examQuestionId.eq(question.id),
    ).all();

    const correctIds = options
      .filter((option) => option.isCorrect)
      .map((option) => option.id)
      .sort((a, b) => a - b);

    if (correctIds.length === 0) {
      throw new Error("An objective question has no correct answer configured.");
    }

    const isCorrect =
      selectedIds.length === correctIds.length &&
      selectedIds.every((id, index) => id === correctIds[index]);

    const awardedMarks = isCorrect ? question.marks : 0;
    score += awardedMarks;

    await tx.orm.public.CBTExamResponse.where((item) =>
      item.id.eq(response.id),
    ).update({
      awardedMarks,
      isCorrect,
      markingStatus: "AUTO_MARKED",
      markedAt: now,
    });
  }

  const finalStatus = requiresManualMarking
    ? "MARKING"
    : input.autoSubmitted
      ? "AUTO_SUBMITTED"
      : "GRADED";

  await tx.orm.public.CBTExamAttempt.where((item) =>
    item.id.eq(attempt.id),
  ).update({
    score,
    maxScore,
    status: finalStatus,
    submittedAt: now,
    autoSubmitted: input.autoSubmitted,
  });

  let reportScoreUpdated = false;

  if (!requiresManualMarking) {
    const settings = await tx.orm.public.CBTExamSettings.where((item) =>
      item.assessmentId.eq(attempt.assessmentId),
    ).first();

    if (settings?.reportMode === "AUTOMATIC") {
      const assessmentAttempts =
        await tx.orm.public.CBTExamAttempt.where((item) =>
          item.assessmentId.eq(attempt.assessmentId),
        ).all();

      const completedAttempts = assessmentAttempts
        .filter(
          (item) =>
            item.studentId === attempt.studentId &&
            (item.status === "GRADED" || item.status === "AUTO_SUBMITTED") &&
            item.submittedAt !== null,
        )
        .sort((a, b) => {
          const timeComparison = globalThis.Temporal.Instant.compare(
            globalThis.Temporal.Instant.from(b.submittedAt!),
            globalThis.Temporal.Instant.from(a.submittedAt!),
          );

          return timeComparison !== 0
            ? timeComparison
            : b.attemptNumber - a.attemptNumber;
        });

      const latestCompletedAttempt = completedAttempts[0];

      if (latestCompletedAttempt?.id === attempt.id) {
        const reportAssessment =
          await tx.orm.public.Assessment.where((item) =>
            item.id.eq(attempt.assessmentId),
          ).first();

        if (!reportAssessment) {
          throw new Error("The assessment linked to this attempt was not found.");
        }

        await recordAssessmentScore(
          {
            schoolId: reportAssessment.schoolId,
            assessmentId: attempt.assessmentId,
            studentId: attempt.studentId,
            score,
          },
          tx,
        );

        reportScoreUpdated = true;
      }
    }
  }

  return {
    attemptId: attempt.id,
    score,
    maxScore,
    status: finalStatus,
    requiresManualMarking,
    reportScoreUpdated,
  };
}

type SubmitCBTAttemptInput = {
  userId: number;
  schoolId: number;
  attemptId: number;
};

export async function submitCBTAttempt(
  input: SubmitCBTAttemptInput,
) {
  const { userId, schoolId, attemptId } = input;

  if (
    !Number.isSafeInteger(userId) || userId <= 0 ||
    !Number.isSafeInteger(schoolId) || schoolId <= 0 ||
    !Number.isSafeInteger(attemptId) || attemptId <= 0
  ) {
    throw new Error("Invalid submission details.");
  }

  return db.transaction(async (tx) => {
    const student = await tx.orm.public.Student.where((item) =>
      item.userId.eq(userId),
    ).first();

    if (!student || student.schoolId !== schoolId || !student.isActive) {
      throw new Error("No active student profile was found.");
    }

    const attempt = await tx.orm.public.CBTExamAttempt.where((item) =>
      item.id.eq(attemptId),
    ).first();

    if (!attempt || attempt.studentId !== student.id) {
      throw new Error("Attempt not found.");
    }

    const assessment = await tx.orm.public.Assessment.where((item) =>
      item.id.eq(attempt.assessmentId),
    ).first();

    if (
      !assessment ||
      assessment.schoolId !== schoolId ||
      assessment.classId !== student.classId
    ) {
      throw new Error("This attempt is not available to you.");
    }

    if (attempt.status !== "IN_PROGRESS") {
      throw new Error("This attempt has already been submitted or is no longer active.");
    }

    const now = globalThis.Temporal.Now.instant();
    const deadline = globalThis.Temporal.Instant.from(attempt.deadlineAt);

    const autoSubmitted =
      globalThis.Temporal.Instant.compare(now, deadline) >= 0;

    return gradeCBTAttempt(tx, {
      attemptId: attempt.id,
      autoSubmitted,
    });
  });
}

type SaveCBTAnswerInput = {
  userId: number;
  schoolId: number;
  attemptId: number;
  questionId: number;
  selectedOptionIds?: number[];
  answerText?: string | null;
};

export async function saveCBTAnswer(input: SaveCBTAnswerInput) {
  const {
    userId,
    schoolId,
    attemptId,
    questionId,
    selectedOptionIds = [],
    answerText = null,
  } = input;

  if (
    !Number.isSafeInteger(userId) || userId <= 0 ||
    !Number.isSafeInteger(schoolId) || schoolId <= 0 ||
    !Number.isSafeInteger(attemptId) || attemptId <= 0 ||
    !Number.isSafeInteger(questionId) || questionId <= 0 ||
    !Array.isArray(selectedOptionIds) ||
    selectedOptionIds.some(
      (id) => !Number.isSafeInteger(id) || id <= 0,
    ) ||
    new Set(selectedOptionIds).size !== selectedOptionIds.length
  ) {
    throw new Error("Invalid answer details.");
  }

  if (answerText !== null && typeof answerText !== "string") {
    throw new Error("Invalid written answer.");
  }

  if (answerText && answerText.length > 20000) {
    throw new Error("Your answer exceeds the maximum allowed length.");
  }

  return db.transaction(async (tx) => {
    const student = await tx.orm.public.Student.where((item) =>
      item.userId.eq(userId),
    ).first();

    if (!student || student.schoolId !== schoolId || !student.isActive) {
      throw new Error("No active student profile was found.");
    }

    const attempt = await tx.orm.public.CBTExamAttempt.where((item) =>
      item.id.eq(attemptId),
    ).first();

    if (!attempt || attempt.studentId !== student.id) {
      throw new Error("Attempt not found.");
    }

    if (attempt.status !== "IN_PROGRESS") {
      throw new Error("This attempt is no longer accepting answers.");
    }

    const now = globalThis.Temporal.Now.instant();
    const deadline = globalThis.Temporal.Instant.from(attempt.deadlineAt);

    if (globalThis.Temporal.Instant.compare(now, deadline) >= 0) {
      throw new Error("Your attempt time has expired. Submit your attempt.");
    }

    const assessment = await tx.orm.public.Assessment.where((item) =>
      item.id.eq(attempt.assessmentId),
    ).first();

    if (
      !assessment ||
      assessment.schoolId !== schoolId ||
      assessment.classId !== student.classId
    ) {
      throw new Error("This attempt is not available to you.");
    }

    const question = await tx.orm.public.CBTExamQuestion.where((item) =>
      item.id.eq(questionId),
    ).first();

    if (!question || question.assessmentId !== attempt.assessmentId) {
      throw new Error("Question not found in this activity.");
    }

    const response = await tx.orm.public.CBTExamResponse.where((item) =>
      item.attemptId.eq(attemptId),
    ).all();

    const questionResponse = response.find(
      (item) => item.examQuestionId === questionId,
    );

    if (!questionResponse) {
      throw new Error("The answer record for this question was not found.");
    }

    if (question.type === "THEORY") {
      if (selectedOptionIds.length > 0) {
        throw new Error("Written questions cannot have selected options.");
      }
    } else {
      if (answerText?.trim()) {
        throw new Error("Objective questions must be answered using their options.");
      }

      if (!question.allowMultipleAnswers && selectedOptionIds.length > 1) {
        throw new Error("Only one option can be selected for this question.");
      }

      const options = await tx.orm.public.CBTExamOption.where((item) =>
        item.examQuestionId.eq(questionId),
      ).all();

      const validOptionIds = new Set(options.map((option) => option.id));

      if (selectedOptionIds.some((id) => !validOptionIds.has(id))) {
        throw new Error("One or more selected options do not belong to this question.");
      }
    }

    await tx.orm.public.CBTExamResponseOption.where((item) =>
      item.responseId.eq(questionResponse.id),
    ).delete();

    for (const examOptionId of selectedOptionIds) {
      await tx.orm.public.CBTExamResponseOption.create({
        responseId: questionResponse.id,
        examOptionId,
      });
    }

    await tx.orm.public.CBTExamResponse.where((item) =>
      item.id.eq(questionResponse.id),
    ).update({
      answerText: question.type === "THEORY" ? answerText?.trim() || null : null,
    });

    return {
      attemptId,
      questionId,
      saved: true,
    };
  });
}

type MarkCBTTheoryResponseInput = {
  userId: number;
  schoolId: number;
  responseId: number;
  awardedMarks: number;
  feedback?: string | null;
};

export async function markCBTTheoryResponse(
  input: MarkCBTTheoryResponseInput,
) {
  const { userId, schoolId, responseId, awardedMarks, feedback } = input;

  if (
    !Number.isSafeInteger(userId) || userId <= 0 ||
    !Number.isSafeInteger(schoolId) || schoolId <= 0 ||
    !Number.isSafeInteger(responseId) || responseId <= 0
  ) {
    throw new Error("Invalid marking details.");
  }

  if (!Number.isFinite(awardedMarks) || awardedMarks < 0) {
    throw new Error("Awarded marks must be a valid non-negative number.");
  }

  if (feedback != null && (typeof feedback !== "string" || feedback.length > 5000)) {
    throw new Error("Feedback cannot exceed 5,000 characters.");
  }

  return db.transaction(async (tx) => {
    const user = await tx.orm.public.User.where((item) =>
      item.id.eq(userId),
    ).first();

    if (
      !user ||
      !user.isActive ||
      user.schoolId !== schoolId ||
      !["TEACHER", "SCHOOL_ADMIN", "SCHOOL_OWNER"].includes(user.role)
    ) {
      throw new Error("You are not authorized to mark CBT responses.");
    }

    const response = await tx.orm.public.CBTExamResponse.where((item) =>
      item.id.eq(responseId),
    ).first();

    if (!response) {
      throw new Error("The response was not found.");
    }

    const attempt = await tx.orm.public.CBTExamAttempt.where((item) =>
      item.id.eq(response.attemptId),
    ).first();

    if (!attempt || attempt.status !== "MARKING") {
      throw new Error("This attempt is not awaiting manual marking.");
    }

    const assessment = await tx.orm.public.Assessment.where((item) =>
      item.id.eq(attempt.assessmentId),
    ).first();

    if (!assessment || assessment.schoolId !== schoolId) {
      throw new Error("Assessment not found.");
    }

    const question = await tx.orm.public.CBTExamQuestion.where((item) =>
      item.id.eq(response.examQuestionId),
    ).first();

    if (
      !question ||
      question.assessmentId !== attempt.assessmentId ||
      question.type !== "THEORY"
    ) {
      throw new Error("Only theory responses can be marked manually.");
    }

    if (awardedMarks > question.marks) {
      throw new Error("Awarded marks cannot exceed the question's maximum marks.");
    }

    if (response.markingStatus === "MANUALLY_MARKED") {
      throw new Error("This response has already been marked.");
    }

    if (user.role === "TEACHER") {
      const teacher = await tx.orm.public.Teacher.where((item) =>
        item.userId.eq(userId),
      ).first();

      if (!teacher || teacher.schoolId !== schoolId) {
        throw new Error("Your teacher profile was not found.");
      }

      const assignments = await tx.orm.public.TeacherAssignment.where((item) =>
        item.teacherId.eq(teacher.id),
      ).all();

      const isAssigned = assignments.some(
        (item) =>
          item.schoolId === schoolId &&
          item.classId === assessment.classId &&
          item.subjectId === assessment.subjectId,
      );

      if (!isAssigned) {
        throw new Error("You are not assigned to this class and subject.");
      }

      const classSubjects = await tx.orm.public.ClassSubject.where((item) =>
        item.classId.eq(assessment.classId),
      ).all();

      if (
        !classSubjects.some(
          (item) =>
            item.schoolId === schoolId &&
            item.subjectId === assessment.subjectId,
        )
      ) {
        throw new Error("This subject is not assigned to the assessment class.");
      }
    }

    const now = globalThis.Temporal.Now.instant().toString();

    await tx.orm.public.CBTExamResponse.where((item) =>
      item.id.eq(response.id),
    ).update({
      awardedMarks,
      isCorrect: null,
      markingStatus: "MANUALLY_MARKED",
      feedback: feedback?.trim() || null,
      markedByUserId: userId,
      markedAt: now,
    });

    const allResponses = await tx.orm.public.CBTExamResponse.where((item) =>
      item.attemptId.eq(attempt.id),
    ).all();

    const allQuestions = await tx.orm.public.CBTExamQuestion.where((item) =>
      item.assessmentId.eq(attempt.assessmentId),
    ).all();

    const pendingTheory = allQuestions.some((item) => {
      if (item.type !== "THEORY") return false;

      const matchingResponse = allResponses.find(
        (entry) => entry.examQuestionId === item.id,
      );

      return !matchingResponse ||
        matchingResponse.markingStatus === "PENDING";
    });

    const totalScore = allResponses.reduce(
      (total, item) => total + (item.awardedMarks ?? 0),
      0,
    );

    const totalMaxScore = allQuestions.reduce(
      (total, item) => total + item.marks,
      0,
    );

    if (pendingTheory) {
      await tx.orm.public.CBTExamAttempt.where((item) =>
        item.id.eq(attempt.id),
      ).update({
        score: totalScore,
        maxScore: totalMaxScore,
      });

      return {
        responseId,
        attemptId: attempt.id,
        awardedMarks,
        fullyGraded: false,
        status: "MARKING" as const,
        reportScoreUpdated: false,
      };
    }

    const finalStatus = attempt.autoSubmitted ? "AUTO_SUBMITTED" : "GRADED";

    await tx.orm.public.CBTExamAttempt.where((item) =>
      item.id.eq(attempt.id),
    ).update({
      score: totalScore,
      maxScore: totalMaxScore,
      status: finalStatus,
    });

    let reportScoreUpdated = false;

    const settings = await tx.orm.public.CBTExamSettings.where((item) =>
      item.assessmentId.eq(attempt.assessmentId),
    ).first();

    if (settings?.reportMode === "AUTOMATIC") {
      const assessmentAttempts =
        await tx.orm.public.CBTExamAttempt.where((item) =>
          item.assessmentId.eq(attempt.assessmentId),
        ).all();

      const completedAttempts = assessmentAttempts
        .filter(
          (item) =>
            item.studentId === attempt.studentId &&
            (item.status === "GRADED" || item.status === "AUTO_SUBMITTED") &&
            item.submittedAt !== null,
        )
        .sort((a, b) => {
          const timeComparison = globalThis.Temporal.Instant.compare(
            globalThis.Temporal.Instant.from(b.submittedAt!),
            globalThis.Temporal.Instant.from(a.submittedAt!),
          );

          return timeComparison !== 0
            ? timeComparison
            : b.attemptNumber - a.attemptNumber;
        });

      if (completedAttempts[0]?.id === attempt.id) {
        await recordAssessmentScore(
          {
            schoolId,
            assessmentId: attempt.assessmentId,
            studentId: attempt.studentId,
            score: totalScore,
          },
          tx,
        );

        reportScoreUpdated = true;
      }
    }

    return {
      responseId,
      attemptId: attempt.id,
      awardedMarks,
      score: totalScore,
      maxScore: totalMaxScore,
      fullyGraded: true,
      status: finalStatus,
      reportScoreUpdated,
    };
  });
}
