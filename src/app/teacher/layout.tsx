import { signOut } from "@/auth";
import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import TeacherPortalShell from "./components/teacher-portal-shell";

export default async function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireRole(["TEACHER"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const school = await db.orm.public.School.where((item) =>
    item.id.eq(schoolId),
  ).first();

  if (!school) {
    throw new Error("School not found.");
  }

  async function handleSignOut() {
    "use server";

    await signOut({
      redirectTo: "/login",
    });
  }

  return (
    <>
      {school.faviconUrl ? <link rel="icon" href={school.faviconUrl} /> : null}

      <TeacherPortalShell
        schoolName={school.name}
        logoUrl={school.logoUrl ?? ""}
        userName={session.user.name ?? "Teacher"}
        userEmail={session.user.email ?? ""}
        userRole="TEACHER"
        signOutAction={handleSignOut}
      >
        {children}
      </TeacherPortalShell>
    </>
  );
}
