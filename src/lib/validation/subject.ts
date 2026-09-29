import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Subject name must be at least 2 characters.")
    .max(100, "Subject name is too long."),

  code: z
    .string()
    .trim()
    .max(20, "Subject code is too long.")
    .optional()
    .or(z.literal("")),

  description: z
    .string()
    .trim()
    .max(250, "Description is too long.")
    .optional()
    .or(z.literal("")),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
