import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/prisma/db";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await db.orm.public.User.where((user) =>
    user.id.eq(Number(session.user.id)),
  ).first();

  if (!user || !user.isActive) {
    redirect("/login");
  }

  const schoolScopedRoles = [
    "SCHOOL_OWNER",
    "SCHOOL_ADMIN",
    "TEACHER",
    "PARENT",
    "STUDENT",
  ];

  if (schoolScopedRoles.includes(user.role)) {
    if (!user.schoolId) {
      redirect("/login");
    }

    const school = await db.orm.public.School.where((school) =>
      school.id.eq(user.schoolId!),
    ).first();

    if (!school || school.status !== "ACTIVE") {
      redirect("/login");
    }
  }

  return {
    ...session,
    user: {
      ...session.user,
      id: String(user.id),
      role: user.role,
      schoolId: user.schoolId,
    },
  };
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();

  if (allowedRoles.includes(session.user.role)) {
    return session;
  }

  switch (session.user.role) {
    case "PLATFORM_OWNER":
    case "PLATFORM_ADMIN":
      redirect("/dashboard");

    case "SCHOOL_OWNER":
    case "SCHOOL_ADMIN":
      redirect("/school/dashboard");

    case "TEACHER":
      redirect("/teacher/dashboard");

    case "PARENT":
      redirect("/parent/dashboard");

    case "STUDENT":
      redirect("/student/dashboard");

    default:
      redirect("/login");
  }
}

export async function requireSchoolUser() {
  const session = await requireAuth();

  if (!session.user.schoolId) {
    throw new Error("School context is required.");
  }

  return session;
}
