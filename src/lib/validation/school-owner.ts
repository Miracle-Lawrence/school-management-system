import { z } from "zod";

export const createSchoolOwnerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Owner name must be at least 2 characters.")
    .max(100, "Owner name is too long."),

  email: z
    .string()
    .trim()
    .email("Enter a valid owner email address.")
    .toLowerCase(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(100, "Password is too long."),
});

export type CreateSchoolOwnerInput = z.infer<typeof createSchoolOwnerSchema>;
