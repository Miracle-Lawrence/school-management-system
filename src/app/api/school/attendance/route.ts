import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/prisma/db";
import { recordAttendance } from "@/lib/services/attendance.service";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (
      session.user.role !== "SCHOOL_OWNER" &&
      session.user.role !== "SCHOOL_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!session.user.schoolId) {
      return NextResponse.json(
        { error: "School context is required." },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);

    const classId = Number(searchParams.get("classId"));

    const termId = Number(searchParams.get("termId"));

    const date = searchParams.get("date");

    if (!Number.isInteger(classId) || !Number.isInteger(termId)) {
      return NextResponse.json(
        { error: "Invalid class or term." },
        { status: 400 },
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "Attendance date is required." },
        { status: 400 },
      );
    }

    const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
      schoolClass.id.eq(classId),
    ).first();

    if (!schoolClass || schoolClass.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: "Invalid class." }, { status: 400 });
    }

    const term = await db.orm.public.Term.where((term) =>
      term.id.eq(termId),
    ).first();

    if (!term) {
      return NextResponse.json({ error: "Invalid term." }, { status: 400 });
    }

    const academicSession = await db.orm.public.AcademicSession.where(
      (academicSession) => academicSession.id.eq(term.sessionId),
    ).first();

    if (
      !academicSession ||
      academicSession.schoolId !== session.user.schoolId
    ) {
      return NextResponse.json(
        { error: "Invalid academic session." },
        { status: 400 },
      );
    }

    const allRecords = await db.orm.public.Attendance.where((attendance) =>
      attendance.classId.eq(classId),
    ).all();

    const records = allRecords
      .filter(
        (record) =>
          record.termId === termId &&
          record.date.toString().slice(0, 10) === date,
      )
      .map((record) => ({
        studentId: record.studentId,
        status: record.status,
      }));

    return NextResponse.json({
      records,
    });
  } catch (error) {
    console.error("Attendance lookup error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load attendance.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (
      session.user.role !== "SCHOOL_OWNER" &&
      session.user.role !== "SCHOOL_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!session.user.schoolId) {
      return NextResponse.json(
        { error: "School context is required." },
        { status: 400 },
      );
    }

    const body = await request.json();

    const { classId, termId, date, records } = body;

    if (!Number.isInteger(classId) || !Number.isInteger(termId)) {
      return NextResponse.json(
        { error: "Invalid class or term." },
        { status: 400 },
      );
    }

    if (typeof date !== "string" || !date) {
      return NextResponse.json(
        { error: "Attendance date is required." },
        { status: 400 },
      );
    }

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "Attendance records are required." },
        { status: 400 },
      );
    }

    const validStatuses = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

    for (const record of records) {
      if (
        !Number.isInteger(record.studentId) ||
        !validStatuses.includes(record.status)
      ) {
        return NextResponse.json(
          { error: "Invalid attendance record." },
          { status: 400 },
        );
      }
    }

    const recordedById = Number(session.user.id);

    for (const record of records) {
      await recordAttendance({
        schoolId: session.user.schoolId,
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
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to record attendance.",
      },
      { status: 400 },
    );
  }
}
