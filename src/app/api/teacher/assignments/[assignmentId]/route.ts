import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { Temporal } from "@js-temporal/polyfill";

type RouteContext = {
  params: Promise<{ assignmentId: string }>;
};

function isPositiveInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireRole(["TEACHER"]);
    const schoolId = session.user.schoolId;
    const userId = Number(session.user.id);

    if (!schoolId || !isPositiveInteger(userId)) {
      return NextResponse.json(
        { message: "Valid school and user context are required." },
        { status: 403 },
      );
    }

    const { assignmentId: rawAssignmentId } = await context.params;
    const assignmentId = Number(rawAssignmentId);

    if (!isPositiveInteger(assignmentId)) {
      return NextResponse.json(
        { message: "Invalid assignment ID." },
        { status: 400 },
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
    const allowedFields = [
      "title",
      "instructions",
      "dueDate",
      "maxScore",
      "isPublished",
    ];

    if (
      !Object.keys(data).some((key) => allowedFields.includes(key)) ||
      Object.keys(data).some((key) => !allowedFields.includes(key))
    ) {
      return NextResponse.json(
        { message: "Provide at least one supported assignment field." },
        { status: 400 },
      );
    }

    if (
      data.title !== undefined &&
      (typeof data.title !== "string" ||
        !data.title.trim() ||
        data.title.trim().length > 200)
    ) {
      return NextResponse.json(
        { message: "Title is required and cannot exceed 200 characters." },
        { status: 400 },
      );
    }

    if (
      data.instructions !== undefined &&
      (typeof data.instructions !== "string" ||
        !data.instructions.trim())
    ) {
      return NextResponse.json(
        { message: "Assignment instructions are required." },
        { status: 400 },
      );
    }

    if (
      data.maxScore !== undefined &&
      (typeof data.maxScore !== "number" ||
        !Number.isFinite(data.maxScore) ||
        data.maxScore <= 0)
    ) {
      return NextResponse.json(
        { message: "Maximum marks must be greater than zero." },
        { status: 400 },
      );
    }

    if (
      data.dueDate !== undefined &&
      data.dueDate !== null &&
      typeof data.dueDate !== "string"
    ) {
      return NextResponse.json(
        { message: "Invalid assignment deadline." },
        { status: 400 },
      );
    }

    if (
      data.isPublished !== undefined &&
      typeof data.isPublished !== "boolean"
    ) {
      return NextResponse.json(
        { message: "Invalid publication status." },
        { status: 400 },
      );
    }

    let normalizedDueDate: string | null | undefined;

    if (typeof data.dueDate === "string") {
      const parsedDate = new Date(data.dueDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { message: "Please provide a valid assignment deadline." },
          { status: 400 },
        );
      }

      normalizedDueDate = parsedDate.toISOString();
    } else if (data.dueDate === null) {
      normalizedDueDate = null;
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

    const assignment = await db.orm.public.Assignment.where({
      id: assignmentId,
      schoolId,
      teacherId: teacher.id,
    }).first();

    if (!assignment) {
      return NextResponse.json(
        { message: "Assignment not found or you do not have permission to manage it." },
        { status: 404 },
      );
    }

    if (data.isPublished === false && assignment.isPublished) {
      return NextResponse.json(
        { message: "A published assignment cannot be changed back to a draft." },
        { status: 400 },
      );
    }

    const submissions =
      data.maxScore !== undefined
        ? await db.orm.public.AssignmentSubmission.where((item) =>
            item.assignmentId.eq(assignmentId),
          ).all()
        : [];

    if (
      data.maxScore !== undefined &&
      submissions.some((submission) => submission.marks !== null)
    ) {
      return NextResponse.json(
        {
          message:
            "Maximum marks cannot be changed after submissions have been graded.",
        },
        { status: 400 },
      );
    }

    const updates: {
      title?: string;
      instructions?: string;
      dueDate?: string | null;
      maxScore?: number;
      isPublished?: boolean;
      publishedAt?: string | null;
    } = {};

    if (typeof data.title === "string") {
      updates.title = data.title.trim();
    }

    if (typeof data.instructions === "string") {
      updates.instructions = data.instructions.trim();
    }

    if (normalizedDueDate !== undefined) {
      updates.dueDate = normalizedDueDate;
    }

    if (typeof data.maxScore === "number") {
      updates.maxScore = data.maxScore;
    }

    if (typeof data.isPublished === "boolean") {
      updates.isPublished = data.isPublished;

      if (data.isPublished && !assignment.isPublished) {
        updates.publishedAt = new Date().toISOString();
      }
    }

    await db.orm.public.Assignment.where({
      id: assignmentId,
      schoolId,
      teacherId: teacher.id,
    }).update(updates);

    const updatedAssignment = await db.orm.public.Assignment.where({
      id: assignmentId,
      schoolId,
      teacherId: teacher.id,
    }).first();

    if (!updatedAssignment) {
      return NextResponse.json(
        { message: "The assignment could not be retrieved after updating." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message:
        !assignment.isPublished && updatedAssignment.isPublished
          ? "Assignment published successfully."
          : "Assignment updated successfully.",
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error("PATCH teacher assignment error:", error);

    return NextResponse.json(
      { message: "Unable to update the assignment." },
      { status: 500 },
    );
  }
}



