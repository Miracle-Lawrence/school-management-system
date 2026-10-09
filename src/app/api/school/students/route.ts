import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export async function GET(request: Request) {
  try {
    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { error: "School context is required." },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const classIdValue = searchParams.get("classId");

    const classId = Number(classIdValue);

    if (!classIdValue || !Number.isInteger(classId)) {
      return NextResponse.json({ error: "Invalid class." }, { status: 400 });
    }

    const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
      schoolClass.id.eq(classId),
    ).first();

    if (!schoolClass || schoolClass.schoolId !== schoolId) {
      return NextResponse.json({ error: "Invalid class." }, { status: 404 });
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

    return NextResponse.json({
      students: classStudents,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Unable to load students." },
      { status: 500 },
    );
  }
}
