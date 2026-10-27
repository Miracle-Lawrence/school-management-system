import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import {
  createAssignment,
  getTeacherAssignments,
} from "@/lib/services/assignment.service";
import { db } from "@/prisma/db";

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0;
}

export async function GET() {
  try {
    const session = await requireRole(["TEACHER"]);
    const schoolId = session.user.schoolId;
    const userId = Number(session.user.id);

    if (!schoolId || !Number.isSafeInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { message: "Valid school and user context are required." },
        { status: 403 },
      );
    }

    const teacher = await db.orm.public.Teacher.where((item) =>
      item.userId.eq(userId),
    ).first();

    if (!teacher || teacher.schoolId !== schoolId) {
      return NextResponse.json(
        { message: "Your teacher profile is not configured correctly." },
        { status: 403 },
      );
    }

    const assignments = await getTeacherAssignments({
      schoolId,
      teacherId: teacher.id,
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("GET teacher assignments error:", error);

    return NextResponse.json(
      { message: "Unable to retrieve assignments." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["TEACHER"]);
    const schoolId = session.user.schoolId;
    const userId = Number(session.user.id);

    if (!schoolId || !Number.isSafeInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { message: "Valid school and user context are required." },
        { status: 403 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    if (
      !isPositiveInteger(data.classId) ||
      !isPositiveInteger(data.subjectId) ||
      typeof data.title !== "string" ||
      typeof data.instructions !== "string" ||
      typeof data.maxScore !== "number" ||
      !Number.isFinite(data.maxScore) ||
      data.maxScore <= 0 ||
      (data.dueDate !== undefined &&
        data.dueDate !== null &&
        typeof data.dueDate !== "string") ||
      (data.isPublished !== undefined &&
        typeof data.isPublished !== "boolean")
    ) {
      return NextResponse.json(
        { message: "Please provide valid assignment details." },
        { status: 400 },
      );
    }

    const teacher = await db.orm.public.Teacher.where((item) =>
      item.userId.eq(userId),
    ).first();

    if (!teacher || teacher.schoolId !== schoolId) {
      return NextResponse.json(
        { message: "Your teacher profile is not configured correctly." },
        { status: 403 },
      );
    }

    const assignment = await createAssignment({
      schoolId,
      teacherId: teacher.id,
      classId: data.classId,
      subjectId: data.subjectId,
      title: data.title,
      instructions: data.instructions,
      dueDate: data.dueDate as string | null | undefined,
      maxScore: data.maxScore,
      isPublished: data.isPublished as boolean | undefined,
    });

    return NextResponse.json(
      {
        message: assignment.isPublished
          ? "Assignment created and published successfully."
          : "Assignment saved as a draft.",
        assignment,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create assignment.";

    console.error("POST teacher assignments error:", error);

    if (
      message.startsWith("Invalid ") ||
      message.includes("required") ||
      message.includes("cannot exceed") ||
      message.includes("Maximum score") ||
      message.includes("valid assignment deadline") ||
      message.includes("not assigned to teach") ||
      message.includes("not assigned to the selected class")
    ) {
      const status =
        message.includes("not assigned to teach") ||
        message.includes("not assigned to the selected class")
          ? 403
          : 400;

      return NextResponse.json({ message }, { status });
    }

    return NextResponse.json(
      { message: "Unable to create assignment." },
      { status: 500 },
    );
  }
}
