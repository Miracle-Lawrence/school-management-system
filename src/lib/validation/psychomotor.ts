import { z } from "zod";

const optionalDescription = z
  .string()
  .trim()
  .max(255, "Description is too long.")
  .optional()
  .or(z.literal(""));

export const psychomotorFieldSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Field name is required.")
    .max(100, "Field name is too long."),

  description: optionalDescription,

  displayOrder: z.coerce
    .number()
    .int("Display order must be a whole number.")
    .min(1, "Display order must be at least 1."),

  isActive: z.boolean().optional(),
});

export const psychomotorRatingOptionSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Rating label is required.")
    .max(100, "Rating label is too long."),

  value: z
    .string()
    .trim()
    .min(1, "Rating value is required.")
    .max(50, "Rating value is too long."),

  displayOrder: z.coerce
    .number()
    .int("Display order must be a whole number.")
    .min(1, "Display order must be at least 1."),

  isActive: z.boolean().optional(),
});

export const studentPsychomotorRatingSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  termId: z.coerce.number().int().positive(),
  fieldId: z.coerce.number().int().positive(),
  ratingId: z.coerce.number().int().positive(),
  comment: z
    .string()
    .trim()
    .max(500, "Comment is too long.")
    .optional()
    .or(z.literal("")),
});

export type PsychomotorFieldInput = z.infer<typeof psychomotorFieldSchema>;

export type PsychomotorRatingOptionInput = z.infer<
  typeof psychomotorRatingOptionSchema
>;

export type StudentPsychomotorRatingInput = z.infer<
  typeof studentPsychomotorRatingSchema
>;
