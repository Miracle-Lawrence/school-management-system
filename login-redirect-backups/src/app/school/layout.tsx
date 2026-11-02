import { signOut } from "@/auth";
import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import SchoolPortalShell from "./components/school-portal-shell";

export default async function SchoolLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const school = await db.orm.public.School.where((school) =>
    school.id.eq(schoolId),
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

      <SchoolPortalShell
        schoolName={school.name}
        logoUrl={school.logoUrl ?? ""}
        userName={session.user.name ?? "School User"}
        userEmail={session.user.email ?? ""}
        userRole={session.user.role ?? ""}
        signOutAction={handleSignOut}
      >
        {children}
      </SchoolPortalShell>
    </>
  );
}
