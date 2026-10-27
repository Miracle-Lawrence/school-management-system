import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

type RouteContext = {
  params: Promise<{ noteId: string }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const auth = await requireRole(["TEACHER"]);
    const schoolId = Number(auth.user.schoolId);
    const userId = Number(auth.user.id);

    if (
      !Number.isSafeInteger(schoolId) ||
      schoolId <= 0 ||
      !Number.isSafeInteger(userId) ||
      userId <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid account information." },
        { status: 400 },
      );
    }

    const { noteId: noteIdParam } = await context.params;
    const noteId = Number(noteIdParam);

    if (!Number.isSafeInteger(noteId) || noteId <= 0) {
      return NextResponse.json(
        { error: "Invalid class note ID." },
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

    const note = await db.orm.public.ClassNote.where((item) =>
      item.id.eq(noteId),
    ).first();

    if (
      !note ||
      note.schoolId !== schoolId ||
      note.teacherId !== teacher.id
    ) {
      return NextResponse.json(
        { error: "Class note not found." },
        { status: 404 },
      );
    }

    const body = await request.json();
    const updates: {
      title?: string;
      content?: string;
      isPublished?: boolean;
      publishedAt?: string | null;
    } = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json(
          { error: "Class note title is required." },
          { status: 400 },
        );
      }

      if (body.title.trim().length > 200) {
        return NextResponse.json(
          { error: "Class note title cannot exceed 200 characters." },
          { status: 400 },
        );
      }

      updates.title = body.title.trim();
    }

    if (body.content !== undefined) {
      if (typeof body.content !== "string" || !body.content.trim()) {
        return NextResponse.json(
          { error: "Class note content is required." },
          { status: 400 },
        );
      }

      if (body.content.length > 100000) {
        return NextResponse.json(
          { error: "Class note content cannot exceed 100,000 characters." },
          { status: 400 },
        );
      }

      updates.content = body.content.trim();
    }

    if (body.isPublished !== undefined) {
      if (typeof body.isPublished !== "boolean") {
        return NextResponse.json(
          { error: "isPublished must be a boolean." },
          { status: 400 },
        );
      }

      if (body.isPublished && !note.isPublished) {
        updates.publishedAt = new Date().toISOString();
      }

      updates.isPublished = body.isPublished;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid changes were provided." },
        { status: 400 },
      );
    }

    const updatedNote = await db.orm.public.ClassNote
      .where((item) =>
        item.id.eq(noteId),
      )
      .update(updates);

    return NextResponse.json({
      message: "Class note updated successfully.",
      note: updatedNote,
    });
  } catch (error) {
    console.error("PATCH teacher class note error:", error);

    return NextResponse.json(
      { error: "Unable to update class note." },
      { status: 500 },
    );
  }
}
