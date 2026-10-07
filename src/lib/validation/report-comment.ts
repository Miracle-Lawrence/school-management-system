import { z } from "zod";

export const reportCommentSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  termId: z.coerce.number().int().positive(),
  reportType: z.enum(["MID_TERM", "TERMINAL"]),
  teacherComment: z
    .string()
    .trim()
    .max(1000, "Teacher comment is too long.")
    .optional()
    .or(z.literal("")),
  principalComment: z
    .string()
    .trim()
    .max(1000, "Principal comment is too long.")
    .optional()
    .or(z.literal("")),
});

export type ReportCommentInput = z.infer<typeof reportCommentSchema>;
