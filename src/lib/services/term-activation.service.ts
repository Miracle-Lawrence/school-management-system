import { db } from "@/prisma/db";

export async function activateTerm(schoolId: number, termId: number) {
  const term = await db.orm.public.Term.where((term) =>
    term.id.eq(termId),
  ).first();

  if (!term) {
    throw new Error("Invalid term.");
  }

  const academicSession = await db.orm.public.AcademicSession.where((session) =>
    session.id.eq(term.sessionId),
  ).first();

  if (!academicSession || academicSession.schoolId !== schoolId) {
    throw new Error("Invalid academic session.");
  }

  if (!academicSession.isActive) {
    throw new Error(
      "The academic session must be active before activating a term.",
    );
  }

  const sessionId = term.sessionId;

  const terms = await db.orm.public.Term.where((existingTerm) =>
    existingTerm.sessionId.eq(sessionId),
  ).all();

  for (const existingTerm of terms) {
    if (existingTerm.id === termId || !existingTerm.isActive) {
      continue;
    }

    await db.orm.public.Term.where((term) =>
      term.id.eq(existingTerm.id),
    ).update({
      isActive: false,
    });
  }

  return db.orm.public.Term.where((term) => term.id.eq(termId)).update({
    isActive: true,
  });
}
