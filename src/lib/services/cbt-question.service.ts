import { db } from "@/prisma/db";
import { resolveImageUrl } from "@/lib/storage/object-storage";
import { assertCBTQuestionBankAccess } from "@/lib/services/cbt-authorization.service";

type CBTQuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "THEORY";

type CBTQuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

type CBTUserContext = {
  schoolId: number;
  userId: number;
  role: string;
};

type CBTOptionInput = {
  text: string;
  isCorrect: boolean;
  displayOrder?: number;
};

type CreateCBTQuestionInput = CBTUserContext & {
  bankId: number;
  type: CBTQuestionType;
  prompt: string;
  marks: number;
  difficulty?: CBTQuestionDifficulty;
  explanation?: string;
  allowMultipleAnswers?: boolean;
  options?: CBTOptionInput[];
};

type UpdateCBTQuestionInput = CBTUserContext & {
  questionId: number;
  prompt?: string;
  type?: CBTQuestionType;
  marks?: number;
  difficulty?: CBTQuestionDifficulty;
  explanation?: string | null;
  allowMultipleAnswers?: boolean;
  options?: CBTOptionInput[];
};

function validatePrompt(prompt: string): string {
  const normalized = prompt.trim();

  if (!normalized || normalized.length > 10000) {
    throw new Error(
      "Question prompt is required and must not exceed 10,000 characters.",
    );
  }

  return normalized;
}

function validateMarks(marks: number): void {
  if (!Number.isFinite(marks) || marks <= 0 || marks > 1000) {
    throw new Error(
      "Question marks must be greater than 0 and not exceed 1,000.",
    );
  }
}

function validateOptions(
  type: CBTQuestionType,
  allowMultipleAnswers: boolean,
  options: CBTOptionInput[],
): CBTOptionInput[] {
  if (type === "THEORY") {
    if (options.length > 0 || allowMultipleAnswers) {
      throw new Error(
        "Theory questions cannot have answer options or multiple-answer selection.",
      );
    }

    return [];
  }

  if (type === "TRUE_FALSE") {
    if (options.length !== 2) {
      throw new Error(
        "True/false questions must have exactly two options.",
      );
    }

    if (allowMultipleAnswers) {
      throw new Error(
        "True/false questions cannot allow multiple answers.",
      );
    }
  }

  if (type === "MULTIPLE_CHOICE" && options.length < 2) {
    throw new Error(
      "Multiple-choice questions must have at least two options.",
    );
  }

  const normalized = options.map((option, index) => {
    if (typeof option.text !== "string") {
      throw new Error(`Option ${index + 1} must contain valid text.`);
    }

    const text = option.text.trim();

    if (!text || text.length > 2000) {
      throw new Error(
        `Option ${index + 1} must contain between 1 and 2,000 characters.`,
      );
    }

    if (typeof option.isCorrect !== "boolean") {
      throw new Error(
        `Option ${index + 1} must have a valid correct-answer setting.`,
      );
    }

    return {
      text,
      isCorrect: option.isCorrect,
      displayOrder: option.displayOrder ?? index + 1,
    };
  });

  const correctCount = normalized.filter(
    (option) => option.isCorrect,
  ).length;

  if (correctCount === 0) {
    throw new Error(
      "At least one correct answer must be selected.",
    );
  }

  if (!allowMultipleAnswers && correctCount !== 1) {
    throw new Error(
      "Select exactly one correct answer for this question.",
    );
  }

  if (type === "TRUE_FALSE" && correctCount !== 1) {
    throw new Error(
      "A true/false question must have exactly one correct answer.",
    );
  }

  const orders = normalized.map(
    (option) => option.displayOrder,
  );

  if (
    orders.some(
      (order) => !Number.isInteger(order) || order < 1,
    ) ||
    new Set(orders).size !== orders.length
  ) {
    throw new Error(
      "Option display orders must be unique positive integers.",
    );
  }

  return normalized;
}

async function validateBank(
  input: CBTUserContext & { bankId: number },
) {
  const bank = await assertCBTQuestionBankAccess(input);

  if (!bank.isActive) {
    throw new Error(
      "Active question bank not found for this school.",
    );
  }

  return bank;
}

export async function getCBTQuestions(
  input: CBTUserContext & {
    bankId: number;
    includeInactive?: boolean;
  },
) {
  await validateBank(input);

  const questions = await db.orm.public.CBTQuestion.where(
    (item) => item.bankId.eq(input.bankId),
  ).all();

  const results = await Promise.all(
    questions
      .filter(
        (question) =>
          input.includeInactive === true || question.isActive,
      )
      .map(async (question) => {
        const [options, images] = await Promise.all([
          db.orm.public.CBTOption.where(
            (item) => item.questionId.eq(question.id),
          ).all(),
          db.orm.public.CBTQuestionImage.where(
            (item) => item.questionId.eq(question.id),
          ).all(),
        ]);

        const optionsWithImages = await Promise.all(
          options
            .sort(
              (a, b) => a.displayOrder - b.displayOrder,
            )
            .map(async (option) => {
              const optionImages =
                await db.orm.public.CBTOptionImage.where(
                  (item) => item.optionId.eq(option.id),
                ).all();

              return {
                ...option,
                images: await Promise.all(
                  optionImages
                    .sort(
                      (a, b) =>
                        a.displayOrder - b.displayOrder,
                    )
                    .map(
                      async ({
                        storageReference,
                        ...image
                      }) => ({
                        ...image,
                        url: await resolveImageUrl(
                          storageReference,
                          input.schoolId,
                        ),
                      }),
                    ),
                ),
              };
            }),
        );

        return {
          ...question,
          options: optionsWithImages,
          images: await Promise.all(
            images
              .sort(
                (a, b) => a.displayOrder - b.displayOrder,
              )
              .map(
                async ({
                  storageReference,
                  ...image
                }) => ({
                  ...image,
                  url: await resolveImageUrl(
                    storageReference,
                    input.schoolId,
                  ),
                }),
              ),
          ),
        };
      }),
  );

  return results.sort((a, b) => a.id - b.id);
}

export async function getCBTQuestionById(
  input: CBTUserContext & {
    questionId: number;
  },
) {
  const question = await db.orm.public.CBTQuestion.where(
    (item) => item.id.eq(input.questionId),
  ).first();

  if (!question) {
    throw new Error("Question not found.");
  }

  return getCBTQuestions({
    ...input,
    bankId: question.bankId,
    includeInactive: true,
  }).then(
    (questions) =>
      questions.find(
        (item) => item.id === input.questionId,
      ) ?? null,
  );
}

export async function createCBTQuestion(
  input: CreateCBTQuestionInput,
) {
  const prompt = validatePrompt(input.prompt);
  validateMarks(input.marks);

  await validateBank({
    schoolId: input.schoolId,
    userId: input.userId,
    role: input.role,
    bankId: input.bankId,
  });

  const allowMultipleAnswers =
    input.allowMultipleAnswers ?? false;

  const options = validateOptions(
    input.type,
    allowMultipleAnswers,
    input.options ?? [],
  );

  const difficulty = input.difficulty ?? "MEDIUM";

  if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
    throw new Error("Invalid question difficulty.");
  }

  return db.transaction(async (tx) => {
    const question = await tx.orm.public.CBTQuestion.create({
      bankId: input.bankId,
      type: input.type,
      allowMultipleAnswers,
      prompt,
      marks: input.marks,
      difficulty,
      explanation: input.explanation?.trim() || null,
      isActive: true,
    });

    for (const option of options) {
      await tx.orm.public.CBTOption.create({
        questionId: question.id,
        text: option.text,
        isCorrect: option.isCorrect,
        displayOrder: option.displayOrder,
      });
    }

    return question;
  });
}

export async function deactivateCBTQuestion(
  input: CBTUserContext & {
    questionId: number;
  },
) {
  const question = await db.orm.public.CBTQuestion.where(
    (item) => item.id.eq(input.questionId),
  ).first();

  if (!question) {
    throw new Error("Question not found.");
  }

  await validateBank({
    schoolId: input.schoolId,
    userId: input.userId,
    role: input.role,
    bankId: question.bankId,
  });

  if (!question.isActive) {
    return question;
  }

  return db.orm.public.CBTQuestion.where(
    (item) => item.id.eq(input.questionId),
  ).update({
    isActive: false,
  });
}

export async function updateCBTQuestion(
  input: UpdateCBTQuestionInput,
) {
  if (
    !Number.isSafeInteger(input.schoolId) ||
    input.schoolId <= 0 ||
    !Number.isSafeInteger(input.userId) ||
    input.userId <= 0 ||
    !Number.isSafeInteger(input.questionId) ||
    input.questionId <= 0
  ) {
    throw new Error(
      "Invalid school, user or question identifier.",
    );
  }

  const question = await db.orm.public.CBTQuestion.where(
    (item) => item.id.eq(input.questionId),
  ).first();

  if (!question) {
    throw new Error("Question not found.");
  }

  await validateBank({
    schoolId: input.schoolId,
    userId: input.userId,
    role: input.role,
    bankId: question.bankId,
  });

  if (!question.isActive) {
    throw new Error("Inactive questions cannot be edited.");
  }

  const snapshots = await db.orm.public.CBTExamQuestion.where(
    (item) => item.sourceQuestionId.eq(input.questionId),
  ).all();

  if (snapshots.length > 0) {
    throw new Error(
      "This question has already been used in a CBT activity and cannot be edited. Create a new question instead.",
    );
  }

  const prompt =
    input.prompt === undefined
      ? question.prompt
      : validatePrompt(input.prompt);

  const marks = input.marks ?? question.marks;
  validateMarks(marks);

  const type = input.type ?? question.type;

  const allowMultipleAnswers =
    input.allowMultipleAnswers ??
    question.allowMultipleAnswers;

  const difficulty =
    input.difficulty ?? question.difficulty;

  if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
    throw new Error("Invalid question difficulty.");
  }

  const options =
    input.options === undefined
      ? null
      : validateOptions(
          type,
          allowMultipleAnswers,
          input.options,
        );

  return db.transaction(async (tx) => {
    if (options !== null) {
      const existingOptions =
        await tx.orm.public.CBTOption.where(
          (item) =>
            item.questionId.eq(input.questionId),
        ).all();

      for (const option of existingOptions) {
        const images =
          await tx.orm.public.CBTOptionImage.where(
            (item) => item.optionId.eq(option.id),
          ).all();

        if (images.length > 0) {
          throw new Error(
            "Cannot replace answer options while they have images. Remove the option images first.",
          );
        }
      }

      for (const option of existingOptions) {
        await tx.orm.public.CBTOption.where(
          (item) => item.id.eq(option.id),
        ).delete();
      }
    }

    const updated =
      await tx.orm.public.CBTQuestion.where(
        (item) => item.id.eq(input.questionId),
      ).update({
        prompt,
        type,
        marks,
        difficulty,
        explanation:
          input.explanation === undefined
            ? question.explanation
            : input.explanation?.trim() || null,
        allowMultipleAnswers,
      });

    if (options !== null) {
      for (const option of options) {
        await tx.orm.public.CBTOption.create({
          questionId: input.questionId,
          text: option.text,
          isCorrect: option.isCorrect,
          displayOrder: option.displayOrder,
        });
      }
    }

    return updated;
  });
}
