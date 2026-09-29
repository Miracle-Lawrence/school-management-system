import { z } from "zod";

export const createTeacherSchema = z.object({
  employeeId: z
    .string()
    .trim()
    .min(1, "Employee ID is required.")
    .max(50, "Employee ID is too long."),

  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters.")
    .max(50, "First name is too long."),

  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters.")
    .max(50, "Last name is too long."),

  phone: z
    .string()
    .trim()
    .max(30, "Phone number is too long.")
    .optional()
    .or(z.literal("")),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .optional()
    .or(z.literal("")),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
