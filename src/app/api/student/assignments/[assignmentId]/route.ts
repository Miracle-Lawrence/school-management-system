import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireApiRole(["STUDENT"]);

    if (session instanceof NextResponse) {
      return session;
    }

    const userId = Number(session.user.id);
    const schoolId = session.user.schoolId;

    if (!isPositiveInteger(userId) || !schoolId) {
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
        { error: "Your account cannot submit assignments." },
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
        { error: "You have not been assigned to a class." },
        { status: 403 },
      );
    }

    const { assignmentId: rawAssignmentId } = await context.params;
    const assignmentId = Number(rawAssignmentId);

    if (!isPositiveInteger(assignmentId)) {
      return NextResponse.json(
        { error: "Invalid assignment ID." },
        { status: 400 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    if (
      Object.keys(data).length !== 1 ||
      !Object.prototype.hasOwnProperty.call(data, "answer")
    ) {
      return NextResponse.json(
        { error: "Provide only the answer field." },
        { status: 400 },
      );
    }

    if (
      typeof data.answer !== "string" ||
      !data.answer.trim()
    ) {
      return NextResponse.json(
        { error: "Your answer cannot be empty." },
        { status: 400 },
      );
    }

    const answer = data.answer.trim();

    if (answer.length > 20000) {
      return NextResponse.json(
        { error: "Your answer cannot exceed 20,000 characters." },
        { status: 400 },
      );
    }

    const assignment = await db.orm.public.Assignment.where({
      id: assignmentId,
      schoolId,
      classId: student.classId,
      isPublished: true,
    }).first();

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            "Assignment not found, not published, or not available to your class.",
        },
        { status: 404 },
      );
    }

    const now = new Date();
    const deadline = assignment.dueDate
      ? new Date(assignment.dueDate).getTime()
      : null;

    if (deadline !== null && now.getTime() > deadline) {
      return NextResponse.json(
        {
          error:
            "The deadline has passed. This assignment can no longer be submitted or updated.",
        },
        { status: 400 },
      );
    }

    const existingSubmission =
      await db.orm.public.AssignmentSubmission.where({
        assignmentId,
        studentId: student.id,
      }).first();

    if (existingSubmission?.marks !== null &&
        existingSubmission?.marks !== undefined) {
      return NextResponse.json(
        {
          error:
            "This assignment has already been graded. You can no longer change your answer.",
        },
        { status: 400 },
      );
    }

    const submittedAt = now.toISOString();

    if (existingSubmission) {
      await db.orm.public.AssignmentSubmission.where({
        id: existingSubmission.id,
        assignmentId,
        studentId: student.id,
      }).update({
        answer,
        submittedAt,
      });
    } else {
      await db.orm.public.AssignmentSubmission.create({
        assignmentId,
        studentId: student.id,
        answer,
        submittedAt,
      });
    }

    const submission = await db.orm.public.AssignmentSubmission.where({
      assignmentId,
      studentId: student.id,
    }).first();

    if (!submission) {
      return NextResponse.json(
        { error: "Unable to retrieve your submission." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: existingSubmission
          ? "Your assignment answer has been updated successfully."
          : "Your assignment has been submitted successfully.",
        submission: {
          id: submission.id,
          assignmentId: submission.assignmentId,
          answer: submission.answer,
          submittedAt: submission.submittedAt,
          marks: submission.marks,
          feedback: submission.feedback,
          gradedAt: submission.gradedAt,
        },
      },
      { status: existingSubmission ? 200 : 201 },
    );
  } catch (error) {
    console.error("Failed to submit student assignment.", error);

    return NextResponse.json(
      { error: "Unable to submit your assignment right now." },
      { status: 500 },
    );
  }
}
