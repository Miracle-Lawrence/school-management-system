import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { recordAttendance } from "@/lib/services/attendance.service";

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
