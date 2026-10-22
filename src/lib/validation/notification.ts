import { z } from "zod";

export const createNotificationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(150, "Title cannot exceed 150 characters."),

  message: z
    .string()
    .trim()
    .min(5, "Message must be at least 5 characters.")
    .max(5000, "Message cannot exceed 5000 characters."),

  category: z.enum([
    "FEE_REMINDER",
    "REPORT_PUBLISHED",
    "ACADEMIC",
    "EVENT",
    "ANNOUNCEMENT",
    "URGENT",
  ]),
});
