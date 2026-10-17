import { z } from "zod";

export const createFeeCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters.")
    .max(100, "Category name is too long."),

  description: z
    .string()
    .trim()
    .max(500, "Description is too long.")
    .optional()
    .or(z.literal("")),
});

export type CreateFeeCategoryInput = z.infer<
  typeof createFeeCategorySchema
>;
