import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export async function GET(request: Request) {
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

    if (!classIdValue || classIdValue.trim() === "") {
      return NextResponse.json(
        { error: "A valid class ID is required." },
        { status: 400 },
      );
    }

    const classId = Number(classIdValue);

    if (!Number.isSafeInteger(classId) || classId <= 0) {
      return NextResponse.json({ error: "Invalid class." }, { status: 400 });
    }

    const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
      schoolClass.id.eq(classId),
    ).first();

    if (!schoolClass || schoolClass.schoolId !== schoolId) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    const students = await db.orm.public.Student.where((student) =>
      student.schoolId.eq(schoolId),
    ).all();

    const classStudents = students
      .filter((student) => student.classId === classId)
      .map((student) => ({
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        gender: student.gender,
      }));

    return NextResponse.json(
      { students: classStudents },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Unable to load students:", error);

    return NextResponse.json(
      { error: "Unable to load students." },
      { status: 500 },
    );
  }
}
