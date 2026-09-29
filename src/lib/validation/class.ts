import { z } from "zod";

export const createClassSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Class name must be at least 2 characters.")
    .max(100, "Class name is too long."),

  level: z
    .string()
    .trim()
    .max(50, "Level is too long.")
    .optional()
    .or(z.literal("")),

  description: z
    .string()
    .trim()
    .max(250, "Description is too long.")
    .optional()
    .or(z.literal("")),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
