import { db } from "@/prisma/db";

type RecordAttendanceInput = {
  schoolId: number;
  studentId: number;
  classId: number;
  termId: number;
  recordedById: number;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  notes?: string;
};

export async function recordAttendance(input: RecordAttendanceInput) {
  const {
    schoolId,
    studentId,
    classId,
    termId,
    recordedById,
    date,
    status,
    notes,
  } = input;

  const student = await db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    throw new Error("Invalid student.");
  }

  if (student.classId !== classId) {
    throw new Error("Student is not assigned to this class.");
  }

  const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    throw new Error("Invalid class.");
  }

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
    throw new Error("The academic session is not active.");
  }

  if (!term.isActive) {
    throw new Error("The term is not active.");
  }

  const recorder = await db.orm.public.User.where((user) =>
    user.id.eq(recordedById),
  ).first();

  if (!recorder || recorder.schoolId !== schoolId || !recorder.isActive) {
    throw new Error("Invalid attendance recorder.");
  }

  const existingRecords = await db.orm.public.Attendance.where((attendance) =>
    attendance.studentId.eq(studentId),
  ).all();

  const existingRecord = existingRecords.find(
    (attendance) =>
      attendance.classId === classId &&
      attendance.date.toString().slice(0, 10) === date,
  );

  if (existingRecord) {
    return db.orm.public.Attendance.where((attendance) =>
      attendance.id.eq(existingRecord.id),
    ).update({
      termId,
      recordedById,
      status,
      notes: notes || null,
    });
  }

  return db.orm.public.Attendance.create({
    schoolId,
    studentId,
    classId,
    termId,
    recordedById,
    date: globalThis.Temporal.Instant.from(`${date}T00:00:00Z`),
    status,
    notes: notes || null,
  });
}
