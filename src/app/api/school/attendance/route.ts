import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { recordAttendance } from "@/lib/services/attendance.service";

const VALID_STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;

type AttendanceStatus = (typeof VALID_STATUSES)[number];

type AttendanceInput = {
  studentId: number;
  status: AttendanceStatus;
};

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function isValidId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export async function GET(request: Request) {
  // Keep authorization outside the database-operation try/catch.
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    return NextResponse.json(
      { error: "School context is required." },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const classIdValue = searchParams.get("classId");
    const termIdValue = searchParams.get("termId");
    const date = searchParams.get("date");

    if (
      !classIdValue ||
      !termIdValue ||
      !/^\d+$/.test(classIdValue) ||
      !/^\d+$/.test(termIdValue)
    ) {
      return NextResponse.json(
        { error: "Invalid class or term." },
        { status: 400 },
      );
    }

    const classId = Number(classIdValue);
    const termId = Number(termIdValue);

    if (!isValidId(classId) || !isValidId(termId)) {
      return NextResponse.json(
        { error: "Invalid class or term." },
        { status: 400 },
      );
    }

    if (!isValidDate(date)) {
      return NextResponse.json(
        { error: "A valid attendance date is required (YYYY-MM-DD)." },
        { status: 400 },
      );
    }

    const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
      schoolClass.id.eq(classId),
    ).first();

    if (!schoolClass || schoolClass.schoolId !== schoolId) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    const term = await db.orm.public.Term.where((term) =>
      term.id.eq(termId),
    ).first();

    if (!term) {
      return NextResponse.json({ error: "Term not found." }, { status: 404 });
    }

    const academicSession = await db.orm.public.AcademicSession.where(
      (academicSession) => academicSession.id.eq(term.sessionId),
    ).first();

    if (!academicSession || academicSession.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Term does not belong to this school." },
        { status: 404 },
      );
    }

    const [attendanceRecords, schoolStudents] = await Promise.all([
      db.orm.public.Attendance.where((attendance) =>
        attendance.classId.eq(classId),
      ).all(),
      db.orm.public.Student.where((student) =>
        student.schoolId.eq(schoolId),
      ).all(),
    ]);

    const validStudents = new Map(
      schoolStudents
        .filter((student) => student.classId === classId)
        .map((student) => [student.id, student]),
    );

    const records = attendanceRecords
      .filter(
        (record) =>
          record.termId === termId &&
          record.date.toString().slice(0, 10) === date &&
          validStudents.has(record.studentId),
      )
      .map((record) => ({
        studentId: record.studentId,
        status: record.status,
      }));

    return NextResponse.json(
      { records },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Attendance lookup error:", error);

    return NextResponse.json(
      { error: "Failed to load attendance." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  // Keep authorization outside the database-operation try/catch.
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    return NextResponse.json(
      { error: "School context is required." },
      { status: 403 },
    );
  }

  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid attendance request." },
        { status: 400 },
      );
    }

    const payload = body as {
      classId?: unknown;
      termId?: unknown;
      date?: unknown;
      records?: unknown;
    };

    const { classId, termId, date, records } = payload;

    if (!isValidId(classId) || !isValidId(termId)) {
      return NextResponse.json(
        { error: "Invalid class or term." },
        { status: 400 },
      );
    }

    if (!isValidDate(date)) {
      return NextResponse.json(
        { error: "A valid attendance date is required (YYYY-MM-DD)." },
        { status: 400 },
      );
    }

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "Attendance records are required." },
        { status: 400 },
      );
    }

    const validatedRecords: AttendanceInput[] = [];

    for (const item of records) {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return NextResponse.json(
          { error: "Invalid attendance record." },
          { status: 400 },
        );
      }

      const record = item as {
        studentId?: unknown;
        status?: unknown;
      };

      if (
        !isValidId(record.studentId) ||
        typeof record.status !== "string" ||
        !VALID_STATUSES.includes(record.status as AttendanceStatus)
      ) {
        return NextResponse.json(
          { error: "Invalid attendance record." },
          { status: 400 },
        );
      }

      validatedRecords.push({
        studentId: record.studentId,
        status: record.status as AttendanceStatus,
      });
    }

    // Reject duplicate student IDs to avoid recording the same student twice.
    const studentIds = validatedRecords.map((record) => record.studentId);

    if (new Set(studentIds).size !== studentIds.length) {
      return NextResponse.json(
        { error: "Duplicate students were submitted." },
        { status: 400 },
      );
    }

    // Confirm the class belongs to the authenticated school.
    const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
      schoolClass.id.eq(classId),
    ).first();

    if (!schoolClass || schoolClass.schoolId !== schoolId) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    // Confirm the term's academic session belongs to this school.
    const term = await db.orm.public.Term.where((term) =>
      term.id.eq(termId),
    ).first();

    if (!term) {
      return NextResponse.json({ error: "Term not found." }, { status: 404 });
    }

    const academicSession = await db.orm.public.AcademicSession.where(
      (academicSession) => academicSession.id.eq(term.sessionId),
    ).first();

    if (!academicSession || academicSession.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Term does not belong to this school." },
        { status: 404 },
      );
    }

    // Every submitted student must belong to this school and this class.
    const schoolStudents = await db.orm.public.Student.where((student) =>
      student.schoolId.eq(schoolId),
    ).all();

    const validStudentIds = new Set(
      schoolStudents
        .filter((student) => student.classId === classId)
        .map((student) => student.id),
    );

    const invalidStudent = validatedRecords.some(
      (record) => !validStudentIds.has(record.studentId),
    );

    if (invalidStudent) {
      return NextResponse.json(
        { error: "One or more students do not belong to this class." },
        { status: 400 },
      );
    }

    const recordedById = Number(session.user.id);

    if (!isValidId(recordedById)) {
      return NextResponse.json(
        { error: "Invalid authenticated user." },
        { status: 403 },
      );
    }

    // Preserve the existing service responsible for recording attendance.
    for (const record of validatedRecords) {
      await recordAttendance({
        schoolId,
        studentId: record.studentId,
        classId,
        termId,
        recordedById,
        date,
        status: record.status,
      });
    }

    return NextResponse.json({
      message: "Attendance recorded successfully.",
    });
  } catch (error) {
    console.error("Attendance recording error:", error);

    return NextResponse.json(
      { error: "Failed to record attendance." },
      { status: 500 },
    );
  }
}
