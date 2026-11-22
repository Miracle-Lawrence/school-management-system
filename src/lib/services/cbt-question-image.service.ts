import { db } from "@/prisma/db";
import {
  deleteStoredImage,
  uploadImage,
  resolveImageUrl,
} from "@/lib/storage/object-storage";

type ImageMetadata = {
  altText?: string;
  caption?: string;
  displayOrder?: number;
};

function validateImageMetadata(metadata: ImageMetadata) {
  const altText = metadata.altText?.trim() || null;
  const caption = metadata.caption?.trim() || null;

  if (altText && altText.length > 300) {
    throw new Error("Image alt text must not exceed 300 characters.");
  }

  if (caption && caption.length > 500) {
    throw new Error("Image caption must not exceed 500 characters.");
  }

  if (
    metadata.displayOrder !== undefined &&
    (!Number.isSafeInteger(metadata.displayOrder) ||
      metadata.displayOrder < 1)
  ) {
    throw new Error("Image display order must be a positive integer.");
  }

  return { altText, caption };
}

async function getNextQuestionImageOrder(questionId: number) {
  const images = await db.orm.public.CBTQuestionImage.where((item) =>
    item.questionId.eq(questionId),
  ).all();

  return images.reduce(
    (maximum, image) => Math.max(maximum, image.displayOrder),
    0,
  ) + 1;
}

async function getNextOptionImageOrder(optionId: number) {
  const images = await db.orm.public.CBTOptionImage.where((item) =>
    item.optionId.eq(optionId),
  ).all();

  return images.reduce(
    (maximum, image) => Math.max(maximum, image.displayOrder),
    0,
  ) + 1;
}

async function validateQuestion(schoolId: number, questionId: number) {
  if (
    !Number.isSafeInteger(schoolId) ||
    schoolId <= 0 ||
    !Number.isSafeInteger(questionId) ||
    questionId <= 0
  ) {
    throw new Error("Invalid school or question identifier.");
  }

  const question = await db.orm.public.CBTQuestion.where((item) =>
    item.id.eq(questionId),
  ).first();

  if (!question) {
    throw new Error("Question not found.");
  }

  const bank = await db.orm.public.CBTQuestionBank.where((item) =>
    item.id.eq(question.bankId),
  ).first();

  if (!bank || bank.schoolId !== schoolId || !bank.isActive) {
    throw new Error("Active question bank not found for this school.");
  }

  if (!question.isActive) {
    throw new Error("Cannot upload images to an inactive question.");
  }

  return question;
}

export async function uploadCBTQuestionImage(
  schoolId: number,
  questionId: number,
  file: File,
  metadata: ImageMetadata = {},
) {
  await validateQuestion(schoolId, questionId);

  const { altText, caption } = validateImageMetadata(metadata);
  const displayOrder =
    metadata.displayOrder ?? await getNextQuestionImageOrder(questionId);

  const storageReference = await uploadImage(file, {
    schoolId,
    category: "cbt-questions",
    visibility: "private",
  });

  try {
    return await db.orm.public.CBTQuestionImage.create({
      questionId,
      storageReference,
      altText,
      caption,
      displayOrder,
    });
  } catch (error) {
    await deleteStoredImage(storageReference, schoolId);
    throw error;
  }
}

export async function uploadCBTOptionImage(
  schoolId: number,
  questionId: number,
  optionId: number,
  file: File,
  metadata: ImageMetadata = {},
) {
  await validateQuestion(schoolId, questionId);

  if (!Number.isSafeInteger(optionId) || optionId <= 0) {
    throw new Error("Invalid option identifier.");
  }

  const option = await db.orm.public.CBTOption.where((item) =>
    item.id.eq(optionId),
  ).first();

  if (!option || option.questionId !== questionId) {
    throw new Error("Option does not belong to this question.");
  }

  const { altText, caption } = validateImageMetadata(metadata);
  const displayOrder =
    metadata.displayOrder ?? await getNextOptionImageOrder(optionId);

  const storageReference = await uploadImage(file, {
    schoolId,
    category: "cbt-questions",
    visibility: "private",
  });

  try {
    return await db.orm.public.CBTOptionImage.create({
      optionId,
      storageReference,
      altText,
      caption,
      displayOrder,
    });
  } catch (error) {
    await deleteStoredImage(storageReference, schoolId);
    throw error;
  }
}


export async function getCBTQuestionImages(
  schoolId: number,
  questionId: number,
) {
  await validateQuestion(schoolId, questionId);

  const images = await db.orm.public.CBTQuestionImage.where((item) =>
    item.questionId.eq(questionId),
  ).all();

  return Promise.all(
    images
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(async ({ storageReference, ...image }) => ({
        ...image,
        url: await resolveImageUrl(storageReference, schoolId),
      })),
  );
}

export async function getCBTOptionImages(
  schoolId: number,
  questionId: number,
  optionId: number,
) {
  await validateQuestion(schoolId, questionId);

  const option = await db.orm.public.CBTOption.where((item) =>
    item.id.eq(optionId),
  ).first();

  if (!option || option.questionId !== questionId) {
    throw new Error("Option does not belong to this question.");
  }

  const images = await db.orm.public.CBTOptionImage.where((item) =>
    item.optionId.eq(optionId),
  ).all();

  return Promise.all(
    images
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(async ({ storageReference, ...image }) => ({
        ...image,
        url: await resolveImageUrl(storageReference, schoolId),
      })),
  );
}

export async function deleteCBTQuestionImage(
  schoolId: number,
  questionId: number,
  imageId: number,
) {
  await validateQuestion(schoolId, questionId);

  if (!Number.isSafeInteger(imageId) || imageId <= 0) {
    throw new Error("Invalid image identifier.");
  }

  const image = await db.orm.public.CBTQuestionImage.where((item) =>
    item.id.eq(imageId),
  ).first();

  if (!image || image.questionId !== questionId) {
    throw new Error("Question image not found.");
  }

  await db.orm.public.CBTQuestionImage.where((item) =>
    item.id.eq(imageId),
  ).delete();

  return { success: true };
}

export async function deleteCBTOptionImage(
  schoolId: number,
  questionId: number,
  optionId: number,
  imageId: number,
) {
  await validateQuestion(schoolId, questionId);

  if (
    !Number.isSafeInteger(optionId) ||
    optionId <= 0 ||
    !Number.isSafeInteger(imageId) ||
    imageId <= 0
  ) {
    throw new Error("Invalid option or image identifier.");
  }

  const option = await db.orm.public.CBTOption.where((item) =>
    item.id.eq(optionId),
  ).first();

  if (!option || option.questionId !== questionId) {
    throw new Error("Option does not belong to this question.");
  }

  const image = await db.orm.public.CBTOptionImage.where((item) =>
    item.id.eq(imageId),
  ).first();

  if (!image || image.optionId !== optionId) {
    throw new Error("Option image not found.");
  }

  await db.orm.public.CBTOptionImage.where((item) =>
    item.id.eq(imageId),
  ).delete();

  return { success: true };
}
