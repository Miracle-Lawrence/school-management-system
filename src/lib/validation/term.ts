import { z } from "zod";

export const createTermSchema = z
  .object({
    sessionId: z.string().min(1, "Academic session is required."),

    name: z
      .string()
      .trim()
      .min(2, "Term name must be at least 2 characters.")
      .max(50, "Term name is too long."),

    startDate: z.string().min(1, "Start date is required."),

    endDate: z.string().min(1, "End date is required."),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date.",
    path: ["endDate"],
  });

export type CreateTermInput = z.infer<typeof createTermSchema>;
