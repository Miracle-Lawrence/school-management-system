import { db } from "@/prisma/db";
import { resolveImageUrl } from "@/lib/storage/object-storage";

type GetStudentCBTAttemptInput = {
  userId: number;
  schoolId: number;
  attemptId: number;
};

function stableOrder<T extends { id: number }>(
  items: T[],
  seed: number,
) {
  return [...items].sort((a, b) => {
    const score = (id: number) => {
      let hash = seed >>> 0;

      for (const character of String(id)) {
        hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
      }

      return hash >>> 0;
    };

    return score(a.id) - score(b.id) || a.id - b.id;
  });
}

export async function getStudentCBTAttempt(
  input: GetStudentCBTAttemptInput,
) {
  const { userId, schoolId, attemptId } = input;

  if (
    !Number.isSafeInteger(userId) || userId <= 0 ||
    !Number.isSafeInteger(schoolId) || schoolId <= 0 ||
    !Number.isSafeInteger(attemptId) || attemptId <= 0
  ) {
    throw new Error("Invalid attempt details.");
  }

  const student = await db.orm.public.Student.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!student || student.schoolId !== schoolId || !student.isActive) {
    throw new Error("No active student profile was found.");
  }

  const attempt = await db.orm.public.CBTExamAttempt.where((item) =>
    item.id.eq(attemptId),
  ).first();

  if (!attempt || attempt.studentId !== student.id) {
    throw new Error("Attempt not found.");
  }

  if (attempt.status !== "IN_PROGRESS") {
    throw new Error("This attempt is no longer active.");
  }

  const assessment = await db.orm.public.Assessment.where((item) =>
    item.id.eq(attempt.assessmentId),
  ).first();

  if (
    !assessment ||
    assessment.schoolId !== schoolId ||
    assessment.classId !== student.classId
  ) {
    throw new Error("This attempt is not available to you.");
  }

  const settings = await db.orm.public.CBTExamSettings.where((item) =>
    item.assessmentId.eq(assessment.id),
  ).first();

  if (!settings) {
    throw new Error("CBT settings were not found.");
  }

  const now = globalThis.Temporal.Now.instant();
  const deadline = globalThis.Temporal.Instant.from(attempt.deadlineAt);

  const questions = await db.orm.public.CBTExamQuestion.where((item) =>
    item.assessmentId.eq(assessment.id),
  ).all();

  if (questions.length === 0) {
    throw new Error("This activity has no published questions.");
  }

  const responses = await db.orm.public.CBTExamResponse.where((item) =>
    item.attemptId.eq(attempt.id),
  ).all();

  if (responses.length !== questions.length) {
    throw new Error("The attempt responses are incomplete.");
  }

  const orderedQuestions = settings.shuffleQuestions
    ? stableOrder(questions, attempt.id)
    : [...questions].sort(
        (a, b) => a.displayOrder - b.displayOrder || a.id - b.id,
      );

  const examQuestions = await Promise.all(
    orderedQuestions.map(async (question) => {
      const response = responses.find(
        (item) => item.examQuestionId === question.id,
      );

      if (!response) {
        throw new Error("A question response is missing.");
      }

      const [options, questionImages, selectedRows] = await Promise.all([
        db.orm.public.CBTExamOption.where((item) =>
          item.examQuestionId.eq(question.id),
        ).all(),
        db.orm.public.CBTExamQuestionImage.where((item) =>
          item.examQuestionId.eq(question.id),
        ).all(),
        db.orm.public.CBTExamResponseOption.where((item) =>
          item.responseId.eq(response.id),
        ).all(),
      ]);

      const orderedOptions = settings.shuffleOptions
        ? stableOrder(options, attempt.id + question.id)
        : [...options].sort(
            (a, b) => a.displayOrder - b.displayOrder || a.id - b.id,
          );

      const safeOptions = await Promise.all(
        orderedOptions.map(async (option) => {
          const optionImages =
            await db.orm.public.CBTExamOptionImage.where((item) =>
              item.examOptionId.eq(option.id),
            ).all();

          return {
            id: option.id,
            text: option.text,
            displayOrder: option.displayOrder,
            images: await Promise.all(
              optionImages
                .sort(
                  (a, b) =>
                    a.displayOrder - b.displayOrder || a.id - b.id,
                )
                .map(async (image) => ({
                  id: image.id,
                  altText: image.altText,
                  caption: image.caption,
                  displayOrder: image.displayOrder,
                  url: await resolveImageUrl(
                    image.storageReference,
                    schoolId,
                  ),
                })),
            ),
          };
        }),
      );

      return {
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        marks: question.marks,
        displayOrder: question.displayOrder,
        allowMultipleAnswers: question.allowMultipleAnswers,
        images: await Promise.all(
          questionImages
            .sort(
              (a, b) =>
                a.displayOrder - b.displayOrder || a.id - b.id,
            )
            .map(async (image) => ({
              id: image.id,
              altText: image.altText,
              caption: image.caption,
              displayOrder: image.displayOrder,
              url: await resolveImageUrl(
                image.storageReference,
                schoolId,
              ),
            })),
        ),
        options: safeOptions,
        savedAnswer: {
          selectedOptionIds: selectedRows.map(
            (item) => item.examOptionId,
          ),
          answerText: response.answerText,
        },
      };
    }),
  );

  return {
    attemptId: attempt.id,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    startedAt: attempt.startedAt,
    deadlineAt: attempt.deadlineAt,
    expired: globalThis.Temporal.Instant.compare(now, deadline) >= 0,
    assessment: {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      maxScore: assessment.maxScore,
      durationMinutes: settings.durationMinutes,
      instructions: settings.instructions,
      allowBackNavigation: settings.allowBackNavigation,
    },
    questions: examQuestions,
  };
}
