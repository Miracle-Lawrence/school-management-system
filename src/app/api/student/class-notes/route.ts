import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireApiRole(["STUDENT"]);

    if (session instanceof NextResponse) {
      return session;
    }

    const userId = Number(session.user.id);
    const schoolId = Number(session.user.schoolId);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      !Number.isSafeInteger(schoolId) ||
      schoolId <= 0
    ) {
      return NextResponse.json(
        { error: "Valid student and school context are required." },
        { status: 400 },
      );
    }

    const user = await db.orm.public.User.where({
      id: userId,
    }).first();

    if (!user || !user.isActive || user.mustChangePassword) {
      return NextResponse.json(
        { error: "Your account cannot access class notes." },
        { status: 403 },
      );
    }

    const student = await db.orm.public.Student.where({
      userId,
    }).first();

    if (
      !student ||
      student.schoolId !== schoolId ||
      !student.isActive
    ) {
      return NextResponse.json(
        { error: "Student profile not found." },
        { status: 403 },
      );
    }

    if (!student.classId) {
      return NextResponse.json(
        {
          notes: [],
          message: "You have not been assigned to a class yet.",
        },
        {
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    const [noteRecords, classes, subjects] = await Promise.all([
      db.orm.public.ClassNote.where({
        schoolId,
        classId: student.classId,
        isPublished: true,
      }).all(),

      db.orm.public.SchoolClass.where({
        id: student.classId,
        schoolId,
      }).all(),

      db.orm.public.Subject.where({
        schoolId,
      }).all(),
    ]);

    const schoolClass = classes[0];
    const subjectById = new Map(
      subjects.map((subject) => [subject.id, subject]),
    );

    const notes = noteRecords
      .map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        classId: note.classId,
        className: schoolClass?.name ?? "My class",
        subjectId: note.subjectId,
        subjectName: subjectById.get(note.subjectId)?.name ?? "Subject",
        publishedAt: note.publishedAt
          ? String(note.publishedAt)
          : null,
        createdAt: note.createdAt
          ? String(note.createdAt)
          : null,
      }))
      .sort((a, b) => {
        const dateA = a.publishedAt
          ? new Date(a.publishedAt).getTime()
          : 0;
        const dateB = b.publishedAt
          ? new Date(b.publishedAt).getTime()
          : 0;

        return dateB - dateA;
      });

    return NextResponse.json(
      { notes },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load student class notes.", error);

    return NextResponse.json(
      { error: "Unable to load class notes right now." },
      { status: 500 },
    );
  }
}
