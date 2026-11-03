import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { resolveImageUrl } from "@/lib/storage/object-storage";
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
  const logoUrl = await resolveImageUrl(school.logoUrl);
  const faviconUrl = await resolveImageUrl(school.faviconUrl);
return (
    <>
      {faviconUrl ? <link rel="icon" href={faviconUrl} /> : null}

      <TeacherPortalShell
        schoolName={school.name}
        logoUrl={logoUrl ?? ""}
        userName={session.user.name ?? "Teacher"}
        userEmail={session.user.email ?? ""}
        userRole="TEACHER"
      >
        {children}
      </TeacherPortalShell>
    </>
  );
}



