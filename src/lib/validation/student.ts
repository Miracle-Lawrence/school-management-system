import { z } from "zod";

export const createStudentSchema = z.object({
  admissionNumber: z
    .string()
    .trim()
    .min(1, "Admission number is required.")
    .max(50, "Admission number is too long."),

  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters.")
    .max(50, "First name is too long."),

  middleName: z
    .string()
    .trim()
    .max(50, "Middle name is too long.")
    .optional()
    .or(z.literal("")),

  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters.")
    .max(50, "Last name is too long."),

  gender: z.enum(["MALE", "FEMALE"]),

  dateOfBirth: z.string().optional().or(z.literal("")),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .trim()
    .max(30, "Phone number is too long.")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .trim()
    .max(250, "Address is too long.")
    .optional()
    .or(z.literal("")),

  classId: z.string().optional().or(z.literal("")),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = createStudentSchema;

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;