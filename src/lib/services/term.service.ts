import { db } from "@/prisma/db";

type CreateTermData = {
  sessionId: number;
  name: string;
  startDate: string;
  endDate: string;
};

export async function createTerm(schoolId: number, data: CreateTermData) {
  const academicSession = await db.orm.public.AcademicSession.where((session) =>
    session.id.eq(data.sessionId),
  ).first();

  if (!academicSession || academicSession.schoolId !== schoolId) {
    throw new Error("Invalid academic session.");
  }

  const existingTerms = await db.orm.public.Term.where((term) =>
    term.sessionId.eq(data.sessionId),
  ).all();

  const existingTerm = existingTerms.find(
    (term) => term.name.toLowerCase() === data.name.toLowerCase(),
  );

  if (existingTerm) {
    throw new Error(
      "A term with this name already exists in this academic session.",
    );
  }

  const term = await db.orm.public.Term.create({
    sessionId: data.sessionId,
    name: data.name,
    startDate: globalThis.Temporal.Instant.from(`${data.startDate}T00:00:00Z`),
    endDate: globalThis.Temporal.Instant.from(`${data.endDate}T00:00:00Z`),
    isActive: false,
  });

  return term;
}
