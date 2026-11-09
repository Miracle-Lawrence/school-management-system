import { z } from "zod";

export const gradeScaleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Grade name is required.")
    .max(100, "Grade name is too long."),

  code: z
    .string()
    .trim()
    .min(1, "Grade code is required.")
    .max(20, "Grade code is too long."),

  minScore: z.coerce
    .number()
    .min(0, "Minimum score cannot be below 0.")
    .finite("Minimum score must be a finite number."),

  maxScore: z.coerce
    .number()
    .min(0, "Maximum score cannot be below 0.")
    .finite("Maximum score must be a finite number."),

  remark: z
    .string()
    .trim()
    .max(255, "Remark is too long.")
    .optional()
    .or(z.literal("")),

  displayOrder: z.coerce
    .number()
    .int("Display order must be a whole number.")
    .min(1, "Display order must be at least 1."),

  isActive: z.boolean().optional(),
});
