import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { resolveImageUrl } from "@/lib/storage/object-storage";
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
  const logoUrl = await resolveImageUrl(school.logoUrl);
  const faviconUrl = await resolveImageUrl(school.faviconUrl);
return (
    <>
      {faviconUrl ? <link rel="icon" href={faviconUrl} /> : null}

      <SchoolPortalShell
        schoolName={school.name}
        logoUrl={logoUrl ?? ""}
        userName={session.user.name ?? "School User"}
        userEmail={session.user.email ?? ""}
        userRole={session.user.role ?? ""}
      >
        {children}
      </SchoolPortalShell>
    </>
  );
}



