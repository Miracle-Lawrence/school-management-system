import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  createClassNote,
  getTeacherClassNotes,
} from "@/lib/services/class-note.service";
import { db } from "@/prisma/db";

export async function GET() {
  try {
    const auth = await requireRole(["TEACHER"]);
    const schoolId = Number(auth.user.schoolId);
    const userId = Number(auth.user.id);

    if (!Number.isSafeInteger(schoolId) || schoolId <= 0 ||
        !Number.isSafeInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { error: "Invalid account information." },
        { status: 400 },
      );
    }

    const teacher = await db.orm.public.Teacher.where((item) =>
      item.userId.eq(userId),
    ).first();

    if (!teacher || teacher.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Teacher profile not found." },
        { status: 403 },
      );
    }

    const notes = await getTeacherClassNotes({
      schoolId,
      teacherId: teacher.id,
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("GET teacher class notes error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve class notes." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(["TEACHER"]);
    const schoolId = Number(auth.user.schoolId);
    const userId = Number(auth.user.id);

    if (!Number.isSafeInteger(schoolId) || schoolId <= 0 ||
        !Number.isSafeInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { error: "Invalid account information." },
        { status: 400 },
      );
    }

    const teacher = await db.orm.public.Teacher.where((item) =>
      item.userId.eq(userId),
    ).first();

    if (!teacher || teacher.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Teacher profile not found." },
        { status: 403 },
      );
    }

    const body = await request.json();

    const classId = Number(body.classId);
    const subjectId = Number(body.subjectId);
    const title = typeof body.title === "string" ? body.title : "";
    const content = typeof body.content === "string" ? body.content : "";
    const isPublished = body.isPublished === true;

    const note = await createClassNote({
      schoolId,
      teacherId: teacher.id,
      classId,
      subjectId,
      title,
      content,
      isPublished,
    });

    return NextResponse.json(
      { message: "Class note created successfully.", note },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create class note.";

    if (
      message.startsWith("Invalid ") ||
      message.includes("required") ||
      message.includes("cannot exceed") ||
      message.includes("not assigned") ||
      message.includes("not assigned to the selected class")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("POST teacher class notes error:", error);

    return NextResponse.json(
      { error: "Unable to create class note." },
      { status: 500 },
    );
  }
}
