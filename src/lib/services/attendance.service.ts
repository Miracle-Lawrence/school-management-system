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

const VALID_STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  try {
    const parsed = globalThis.Temporal.PlainDate.from(value);
    return parsed.toString() === value;
  } catch {
    return false;
  }
}

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

  // Validate identifiers and input before accessing the database.
  for (const [name, value] of Object.entries({
    schoolId,
    studentId,
    classId,
    termId,
    recordedById,
  })) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`Invalid ${name}.`);
    }
  }

  if (!isValidDate(date)) {
    throw new Error("Invalid attendance date. Use YYYY-MM-DD.");
  }

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    throw new Error("Invalid attendance status.");
  }

  if (notes !== undefined && typeof notes !== "string") {
    throw new Error("Invalid attendance notes.");
  }

  // Verify the school exists and is active.
  const school = await db.orm.public.School.where((school) =>
    school.id.eq(schoolId),
  ).first();

  if (!school || school.status !== "ACTIVE") {
    throw new Error("School is not active.");
  }

  // Verify the student belongs to this school and class.
  const student = await db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    throw new Error("Invalid student.");
  }

  if (!student.isActive) {
    throw new Error("Attendance cannot be recorded for an inactive student.");
  }

  if (student.classId !== classId) {
    throw new Error("Student is not assigned to this class.");
  }

  // Verify the class belongs to this school.
  const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    throw new Error("Invalid class.");
  }

  // Verify the term and its academic session belong to this school.
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

  const attendanceDate = globalThis.Temporal.PlainDate.from(date);

  const sessionStart = globalThis.Temporal.PlainDate.from(
    academicSession.startDate.toString().slice(0, 10),
  );

  const sessionEnd = globalThis.Temporal.PlainDate.from(
    academicSession.endDate.toString().slice(0, 10),
  );

  if (
    globalThis.Temporal.PlainDate.compare(attendanceDate, sessionStart) < 0 ||
    globalThis.Temporal.PlainDate.compare(attendanceDate, sessionEnd) > 0
  ) {
    throw new Error("Attendance date must be within the academic session.");
  }

  const termStart = globalThis.Temporal.PlainDate.from(
    term.startDate.toString().slice(0, 10),
  );

  const termEnd = globalThis.Temporal.PlainDate.from(
    term.endDate.toString().slice(0, 10),
  );

  if (
    globalThis.Temporal.PlainDate.compare(attendanceDate, termStart) < 0 ||
    globalThis.Temporal.PlainDate.compare(attendanceDate, termEnd) > 0
  ) {
    throw new Error("Attendance date must be within the active term.");
  }

  // Verify the recording user belongs to this school and is active.
  const recorder = await db.orm.public.User.where((user) =>
    user.id.eq(recordedById),
  ).first();

  if (!recorder || recorder.schoolId !== schoolId || !recorder.isActive) {
    throw new Error("Invalid attendance recorder.");
  }

  // Find an existing record for this student and attendance date.
  const existingRecords = await db.orm.public.Attendance.where((attendance) =>
    attendance.studentId.eq(studentId),
  ).all();

  const existingRecord = existingRecords.find(
    (attendance) =>
      attendance.classId === classId &&
      attendance.date.toString().slice(0, 10) === date,
  );

  if (existingRecord) {
    // Never update an existing record belonging to another school.
    if (
      existingRecord.schoolId !== schoolId ||
      existingRecord.studentId !== studentId ||
      existingRecord.classId !== classId
    ) {
      throw new Error("Existing attendance record failed ownership checks.");
    }

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
