import { signOut } from "@/auth";
import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import StudentPortalShell from "./components/StudentPortalShell";

type StudentLayoutProps = {
  children: ReactNode;
};

export default async function StudentLayout({
  children,
}: StudentLayoutProps) {
  const session = await requireRole(["STUDENT"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("Student account is not associated with a school.");
  }

  const userId = Number(session.user.id);

  if (!Number.isInteger(userId)) {
    redirect("/login");
  }

  const user = await db.orm.public.User.where((item) =>
    item.id.eq(userId),
  ).first();

  if (!user || !user.isActive) {
    redirect("/login");
  }


  const school = await db.orm.public.School.where((item) =>
    item.id.eq(schoolId),
  ).first();

  if (!school) {
    throw new Error("School associated with this student was not found.");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <StudentPortalShell
      schoolName={school.name}
      logoUrl={school.logoUrl || school.faviconUrl || ""}
      userName={session.user.name ?? ""}
      userEmail={session.user.email ?? ""}
      userRole={session.user.role}
      signOutAction={handleSignOut}
    >
      {children}
    </StudentPortalShell>
  );
}

