import { db } from "@/prisma/db";

export async function activateAcademicSession(
  schoolId: number,
  sessionId: number,
) {
  const academicSession = await db.orm.public.AcademicSession.where((session) =>
    session.id.eq(sessionId),
  ).first();

  if (!academicSession || academicSession.schoolId !== schoolId) {
    throw new Error("Invalid academic session.");
  }

  const sessions = await db.orm.public.AcademicSession.where((session) =>
    session.schoolId.eq(schoolId),
  ).all();

  for (const session of sessions) {
    if (session.id === sessionId) {
      continue;
    }

    if (session.isActive) {
      await db.orm.public.AcademicSession.where((academicSession) =>
        academicSession.id.eq(session.id),
      ).update({
        isActive: false,
      });
    }
  }

  return db.orm.public.AcademicSession.where((academicSession) =>
    academicSession.id.eq(sessionId),
  ).update({
    isActive: true,
  });
}
