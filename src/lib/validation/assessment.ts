import { z } from "zod";

export const createAssessmentSchema = z.object({
  classId: z.coerce.number().int().positive("Please select a valid class."),
  subjectId: z.coerce.number().int().positive("Please select a valid subject."),
  termId: z.coerce
    .number()
    .int()
    .positive("Please select a valid academic term."),

  title: z
    .string()
    .trim()
    .min(2, "Assessment title must be at least 2 characters.")
    .max(100, "Assessment title is too long."),

  type: z.enum([
    "ASSIGNMENT",
    "TEST",
    "CA",
    "EXAM",
    "PROJECT",
    "PRACTICAL",
    "OTHER",
  ]),

  maxScore: z.coerce
    .number()
    .positive("Maximum score must be greater than zero."),

  weight: z.coerce
    .number()
    .positive("Assessment weight must be greater than zero."),

  date: z.string().optional().or(z.literal("")),

  description: z
    .string()
    .trim()
    .max(500, "Description is too long.")
    .optional()
    .or(z.literal("")),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;

export const updateAssessmentSchema = createAssessmentSchema;

export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;
