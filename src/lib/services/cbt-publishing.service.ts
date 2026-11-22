import { db } from "@/prisma/db";
import { assertCBTClassSubjectAccess } from "./cbt-authorization.service";

type PublishCBTActivityInput = {
  schoolId: number;
  userId: number;
  role: string;
  assessmentId: number;
  questionIds: number[];
};

type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "THEORY";

const ADMIN_ROLES = ["SCHOOL_OWNER", "SCHOOL_ADMIN"];

function validateQuestion(
  type: QuestionType,
  allowMultipleAnswers: boolean,
  options: Array<{
    text: string;
    isCorrect: boolean;
    displayOrder: number;
  }>,
) {
  if (type === "THEORY") {
    if (options.length > 0 || allowMultipleAnswers) {
      throw new Error("Theory questions cannot have options or multiple-answer selection.");
    }
    return;
  }

  if (type === "TRUE_FALSE" && options.length !== 2) {
    throw new Error("True/false questions must have exactly two options.");
  }

  if (type === "TRUE_FALSE" && allowMultipleAnswers) {
    throw new Error("True/false questions cannot allow multiple answers.");
  }

  if (type === "MULTIPLE_CHOICE" && options.length < 2) {
    throw new Error("Multiple-choice questions must have at least two options.");
  }

  if (options.some((option) => !option.text.trim())) {
    throw new Error("Every answer option must contain text.");
  }

  const correctCount = options.filter((option) => option.isCorrect).length;

  if (correctCount < 1) {
    throw new Error("Every objective question must have at least one correct answer.");
  }

  if (!allowMultipleAnswers && correctCount !== 1) {
    throw new Error("A single-answer question must have exactly one correct answer.");
  }

  if (type === "TRUE_FALSE" && correctCount !== 1) {
    throw new Error("A true/false question must have exactly one correct answer.");
  }

  const orders = options.map((option) => option.displayOrder);

  if (
    orders.some((order) => !Number.isInteger(order) || order < 1) ||
    new Set(orders).size !== orders.length
  ) {
    throw new Error("Option display orders must be unique positive integers.");
  }
}

export async function publishCBTActivity(
  input: PublishCBTActivityInput,
) {
  if (
    !Number.isSafeInteger(input.schoolId) ||
    input.schoolId <= 0 ||
    !Number.isSafeInteger(input.userId) ||
    input.userId <= 0 ||
    !Number.isSafeInteger(input.assessmentId) ||
    input.assessmentId <= 0
  ) {
    throw new Error("Invalid CBT authorization context or assessment identifier.");
  }

  if (
    !ADMIN_ROLES.includes(input.role) &&
    input.role !== "TEACHER"
  ) {
    throw new Error("You are not authorized to publish CBT activities.");
  }

  if (
    !Array.isArray(input.questionIds) ||
    input.questionIds.length === 0 ||
    input.questionIds.some(
      (id) => !Number.isSafeInteger(id) || id <= 0,
    )
  ) {
    throw new Error("Select at least one valid question.");
  }

  if (new Set(input.questionIds).size !== input.questionIds.length) {
    throw new Error("Duplicate question IDs are not allowed.");
  }

  return db.transaction(async (tx) => {
    const assessment = await tx.orm.public.Assessment.where((item) =>
      item.id.eq(input.assessmentId),
    ).first();

    if (!assessment || assessment.schoolId !== input.schoolId) {
      throw new Error("Assessment not found.");
    }

    // Teachers must be assigned to this exact class and subject.
    // School owners and admins can publish across their school.
    await assertCBTClassSubjectAccess({
      schoolId: input.schoolId,
      userId: input.userId,
      role: input.role,
      classId: assessment.classId,
      subjectId: assessment.subjectId,
    });

    const settings = await tx.orm.public.CBTExamSettings.where((item) =>
      item.assessmentId.eq(input.assessmentId),
    ).first();

    if (!settings) {
      throw new Error("CBT settings must be created before publishing.");
    }

    if (settings.status !== "DRAFT") {
      throw new Error("Only draft CBT activities can be published.");
    }

    const existingQuestions = await tx.orm.public.CBTExamQuestion.where(
      (item) => item.assessmentId.eq(input.assessmentId),
    ).all();

    if (existingQuestions.length > 0) {
      throw new Error("This assessment already has CBT question snapshots.");
    }

    const existingAttempts = await tx.orm.public.CBTExamAttempt.where(
      (item) => item.assessmentId.eq(input.assessmentId),
    ).all();

    if (existingAttempts.length > 0) {
      throw new Error("An activity with existing attempts cannot be published again.");
    }

    if (settings.activityTypeId != null) {
      const activityType = await tx.orm.public.CBTActivityType.where(
        (item) => item.id.eq(settings.activityTypeId!),
      ).first();

      if (
        !activityType ||
        activityType.schoolId !== input.schoolId ||
        !activityType.isActive
      ) {
        throw new Error("The configured CBT activity type is no longer active.");
      }
    }

    if (settings.reportMode === "AUTOMATIC") {
      if (!assessment.assessmentCategoryId) {
        throw new Error("Automatic report integration requires an assessment category.");
      }

      const category = await tx.orm.public.AssessmentCategory.where(
        (item) => item.id.eq(assessment.assessmentCategoryId!),
      ).first();

      if (
        !category ||
        category.schoolId !== input.schoolId ||
        !category.isActive ||
        category.type !== assessment.type
      ) {
        throw new Error("The assessment category is invalid for automatic report integration.");
      }
    }

    const selectedQuestions = [];

    for (const questionId of input.questionIds) {
      const question = await tx.orm.public.CBTQuestion.where(
        (item) => item.id.eq(questionId),
      ).first();

      if (!question || !question.isActive) {
        throw new Error(`Question ${questionId} was not found or is inactive.`);
      }

      const bank = await tx.orm.public.CBTQuestionBank.where(
        (item) => item.id.eq(question.bankId),
      ).first();

      if (
        !bank ||
        !bank.isActive ||
        bank.schoolId !== input.schoolId ||
        bank.subjectId !== assessment.subjectId
      ) {
        throw new Error(
          `Question ${questionId} does not belong to an active question bank for this school's assessment subject.`,
        );
      }

      // Teachers can only publish questions from their own banks.
      // Admins can use any eligible bank in their school.
      if (
        !ADMIN_ROLES.includes(input.role) &&
        bank.createdById !== input.userId
      ) {
        throw new Error(
          `Question ${questionId} belongs to another teacher's question bank.`,
        );
      }

      const [options, images] = await Promise.all([
        tx.orm.public.CBTOption.where(
          (item) => item.questionId.eq(question.id),
        ).all(),
        tx.orm.public.CBTQuestionImage.where(
          (item) => item.questionId.eq(question.id),
        ).all(),
      ]);

      const orderedOptions = options.sort(
        (a, b) => a.displayOrder - b.displayOrder,
      );

      validateQuestion(
        question.type,
        question.allowMultipleAnswers,
        orderedOptions,
      );

      const optionsWithImages = [];

      for (const option of orderedOptions) {
        const optionImages = await tx.orm.public.CBTOptionImage.where(
          (item) => item.optionId.eq(option.id),
        ).all();

        optionsWithImages.push({
          option,
          images: optionImages.sort(
            (a, b) => a.displayOrder - b.displayOrder,
          ),
        });
      }

      selectedQuestions.push({
        question,
        images: images.sort((a, b) => a.displayOrder - b.displayOrder),
        options: optionsWithImages,
      });
    }

    const totalMarks = selectedQuestions.reduce(
      (total, item) => total + item.question.marks,
      0,
    );

    if (Math.abs(totalMarks - assessment.maxScore) > 0.000001) {
      throw new Error(
        `Selected questions total ${totalMarks} marks, but the assessment maximum is ${assessment.maxScore}.`,
      );
    }

    for (const [index, item] of selectedQuestions.entries()) {
      const snapshot = await tx.orm.public.CBTExamQuestion.create({
        assessmentId: input.assessmentId,
        sourceQuestionId: item.question.id,
        type: item.question.type,
        allowMultipleAnswers: item.question.allowMultipleAnswers,
        prompt: item.question.prompt,
        explanation: item.question.explanation,
        marks: item.question.marks,
        displayOrder: index + 1,
      });

      for (const image of item.images) {
        await tx.orm.public.CBTExamQuestionImage.create({
          examQuestionId: snapshot.id,
          storageReference: image.storageReference,
          altText: image.altText,
          caption: image.caption,
          displayOrder: image.displayOrder,
        });
      }

      for (const itemOption of item.options) {
        const optionSnapshot = await tx.orm.public.CBTExamOption.create({
          examQuestionId: snapshot.id,
          sourceOptionId: itemOption.option.id,
          text: itemOption.option.text,
          isCorrect: itemOption.option.isCorrect,
          displayOrder: itemOption.option.displayOrder,
        });

        for (const image of itemOption.images) {
          await tx.orm.public.CBTExamOptionImage.create({
            examOptionId: optionSnapshot.id,
            storageReference: image.storageReference,
            altText: image.altText,
            caption: image.caption,
            displayOrder: image.displayOrder,
          });
        }
      }
    }

    const now = globalThis.Temporal.Now.instant();

    if (settings.closesAt) {
      const closing = globalThis.Temporal.Instant.from(settings.closesAt);

      if (globalThis.Temporal.Instant.compare(closing, now) <= 0) {
        throw new Error("The activity closing date must be in the future.");
      }
    }

    const scheduled = settings.opensAt
      ? globalThis.Temporal.Instant.compare(
          globalThis.Temporal.Instant.from(settings.opensAt),
          now,
        ) > 0
      : false;

    const updatedSettings = await tx.orm.public.CBTExamSettings.where(
      (item) => item.id.eq(settings.id),
    ).update({
      status: scheduled ? "SCHEDULED" : "PUBLISHED",
    });

    return {
      assessmentId: input.assessmentId,
      status: scheduled ? "SCHEDULED" : "PUBLISHED",
      questionCount: selectedQuestions.length,
      totalMarks,
      settings: updatedSettings,
    };
  });
}
