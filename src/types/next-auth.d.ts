import type { UserRole } from "@/prisma/contract";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    schoolId: number | null;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      schoolId: number | null;
    } & Session["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    schoolId: number | null;
  }
}
