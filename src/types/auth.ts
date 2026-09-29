export const USER_ROLES = [
  "PLATFORM_OWNER",
  "PLATFORM_ADMIN",
  "SCHOOL_OWNER",
  "SCHOOL_ADMIN",
  "TEACHER",
  "PARENT",
  "STUDENT",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
