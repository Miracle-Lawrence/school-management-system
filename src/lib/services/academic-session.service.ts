import "dotenv/config";

import { db } from "@/prisma/db";

type CreateAcademicSessionData = {
  name: string;
  startDate: string;
  endDate: string;
};

export async function createAcademicSession(
  schoolId: number,
  data: CreateAcademicSessionData,
) {
  const existingSessions = await db.orm.public.AcademicSession.where(
    (session) => session.schoolId.eq(schoolId),
  ).all();

  const existingSession = existingSessions.find(
    (session) => session.name.toLowerCase() === data.name.toLowerCase(),
  );

  if (existingSession) {
    throw new Error("An academic session with this name already exists.");
  }

  const startDate = Temporal.Instant.from(`${data.startDate}T00:00:00Z`);

  const endDate = Temporal.Instant.from(`${data.endDate}T00:00:00Z`);

  const session = await db.orm.public.AcademicSession.create({
    schoolId,
    name: data.name,
    startDate,
    endDate,
    isActive: false,
  });

  return session;
}

type UpdateAcademicSessionData = {
  name: string;
  startDate: string;
  endDate: string;
};

export async function updateAcademicSession(
  schoolId: number,
  sessionId: number,
  data: UpdateAcademicSessionData,
) {
  const academicSession = await db.orm.public.AcademicSession.where((session) =>
    session.id.eq(sessionId),
  ).first();

  if (!academicSession || academicSession.schoolId !== schoolId) {
    throw new Error("Invalid academic session.");
  }

  const existingSessions = await db.orm.public.AcademicSession.where(
    (session) => session.schoolId.eq(schoolId),
  ).all();

  const duplicateSession = existingSessions.find(
    (session) =>
      session.id !== sessionId &&
      session.name.toLowerCase() === data.name.toLowerCase(),
  );

  if (duplicateSession) {
    throw new Error("An academic session with this name already exists.");
  }

  const startDate = Temporal.Instant.from(`${data.startDate}T00:00:00Z`);
  const endDate = Temporal.Instant.from(`${data.endDate}T00:00:00Z`);

  const terms = await db.orm.public.Term.where((term) =>
    term.sessionId.eq(sessionId),
  ).all();

  for (const term of terms) {
    if (term.startDate < startDate || term.endDate > endDate) {
      throw new Error(
        `The academic session dates must contain all existing terms. "${term.name}" falls outside the new session dates.`,
      );
    }
  }

  const updatedSession = await db.orm.public.AcademicSession.where((session) =>
    session.id.eq(sessionId),
  ).update({
    name: data.name,
    startDate,
    endDate,
  });

  return updatedSession;
}
