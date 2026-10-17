import { z } from "zod";

export const createFeeStructureSchema = z.object({
  categoryId: z.number().int().positive(),
  classId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  termId: z.number().int().positive(),

  amount: z
    .string()
    .trim()
    .regex(
      /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
      "Enter a valid amount with at most two decimal places.",
    )
    .refine(
      (value) => Number(value) > 0 && Number.isFinite(Number(value)),
      "Amount must be greater than zero.",
    ),

  isMandatory: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;
