import { z } from "zod";

export const createSchoolSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "School name must be at least 2 characters.")
    .max(150, "School name is too long."),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "School slug must be at least 2 characters.")
    .max(100, "School slug is too long.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase letters, numbers, and hyphens.",
    ),

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

  city: z
    .string()
    .trim()
    .max(100, "City name is too long.")
    .optional()
    .or(z.literal("")),

  state: z
    .string()
    .trim()
    .max(100, "State name is too long.")
    .optional()
    .or(z.literal("")),
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
