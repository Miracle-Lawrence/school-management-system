import { signOut } from "@/auth";
import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

import ParentPortalShell from "./components/ParentPortalShell";
import ParentLayoutContent from "./components/ParentLayoutContent";

import type { ReactNode } from "react";

type ParentLayoutProps = {
  children: ReactNode;
};

export default async function ParentLayout({ children }: ParentLayoutProps) {
  const session = await requireRole(["PARENT"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("Parent account is not associated with a school.");
  }

  const school = await db.orm.public.School.where((item) =>
    item.id.eq(schoolId),
  ).first();

  if (!school) {
    throw new Error(
      "School associated with this parent account was not found.",
    );
  }

  async function handleSignOut() {
    "use server";

    await signOut({ redirectTo: "/login" });
  }

  const logoUrl = school.logoUrl || school.faviconUrl || "";

  return (
    <ParentPortalShell
      schoolName={school.name}
      logoUrl={logoUrl}
      userName={session.user.name ?? ""}
      userEmail={session.user.email ?? ""}
      userRole={session.user.role}
      signOutAction={handleSignOut}
    >
      <ParentLayoutContent>{children}</ParentLayoutContent>
    </ParentPortalShell>
  );
}
