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
