import { z } from "zod";

export const createParentSchema = z.object({
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
    .email("Enter a valid email address."),
  
  password: z
    .string()
    .min(4, "Password must be at least 4 characters.")
    .max(128),
    

  address: z
    .string()
    .trim()
    .max(250, "Address is too long.")
    .optional()
    .or(z.literal("")),
});

export type CreateParentInput = z.infer<typeof createParentSchema>;
