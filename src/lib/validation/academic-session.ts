import { z } from "zod";

export const createAcademicSessionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(4, "Session name must be at least 4 characters.")
      .max(50, "Session name is too long."),

    startDate: z.string().min(1, "Start date is required."),

    endDate: z.string().min(1, "End date is required."),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date.",
    path: ["endDate"],
  });

export type CreateAcademicSessionInput = z.infer<
  typeof createAcademicSessionSchema
>;
