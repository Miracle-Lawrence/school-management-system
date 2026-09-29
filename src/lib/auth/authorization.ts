import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Forbidden.");
  }

  return session;
}

export async function requireSchoolUser() {
  const session = await requireAuth();

  if (!session.user.schoolId) {
    throw new Error("School context is required.");
  }

  return session;
}
