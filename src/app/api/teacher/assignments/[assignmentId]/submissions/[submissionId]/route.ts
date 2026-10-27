import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    assignmentId: string;
    submissionId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await requireRole(["TEACHER"]);

    const userId = Number(session.user.id);
    const schoolId = session.user.schoolId;

    const {
      assignmentId: assignmentIdParam,
      submissionId: submissionIdParam,
    } = await context.params;

    const assignmentId = Number(assignmentIdParam);
    const submissionId = Number(submissionIdParam);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      !schoolId ||
      !Number.isSafeInteger(assignmentId) ||
      assignmentId <= 0 ||
      !Number.isSafeInteger(submissionId) ||
      submissionId <= 0
    ) {
      return NextResponse.json(
        { error: "Valid teacher, school, assignment, and submission details are required." },
        { status: 400 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "A valid JSON request body is required." },
        { status: 400 },
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("marks" in body) ||
      !("feedback" in body)
    ) {
      return NextResponse.json(
        { error: "Marks and feedback are required." },
        { status: 400 },
      );
    }

    const { marks, feedback } = body as {
      marks: unknown;
      feedback: unknown;
    };

    if (
      typeof marks !== "number" ||
      !Number.isFinite(marks) ||
      marks < 0
    ) {
      return NextResponse.json(
        { error: "Marks must be a valid non-negative number." },
        { status: 400 },
      );
    }

    if (
      typeof feedback !== "string" ||
      feedback.trim().length > 5000
    ) {
      return NextResponse.json(
        { error: "Feedback must be text no longer than 5000 characters." },
        { status: 400 },
      );
    }

    const teacher = await db.orm.public.Teacher.where({
      userId,
    }).first();

    if (!teacher || teacher.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Teacher profile not found." },
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
        { error: "Assignment not found or you do not have permission to grade it." },
        { status: 404 },
      );
    }

    const teacherAssignments =
      await db.orm.public.TeacherAssignment.where((item) =>
        item.teacherId.eq(teacher.id),
      ).all();

    const isAssignedToClassSubject = teacherAssignments.some(
      (item) =>
        item.schoolId === schoolId &&
        item.classId === assignment.classId &&
        item.subjectId === assignment.subjectId,
    );

    if (!isAssignedToClassSubject) {
      return NextResponse.json(
        { error: "You are not assigned to teach this class and subject." },
        { status: 403 },
      );
    }

    if (marks > assignment.maxScore) {
      return NextResponse.json(
        { error: `Marks cannot exceed ${assignment.maxScore}.` },
        { status: 400 },
      );
    }

    const submission =
      await db.orm.public.AssignmentSubmission.where({
        id: submissionId,
        assignmentId: assignment.id,
      }).first();

    if (!submission || submission.submittedAt === null) {
      return NextResponse.json(
        { error: "A submitted answer could not be found." },
        { status: 404 },
      );
    }

    const gradedAt = new Date().toISOString();

    await db.orm.public.AssignmentSubmission.where({
      id: submission.id,
      assignmentId: assignment.id,
    }).update({
      marks,
      feedback: feedback.trim() || null,
      gradedByUserId: userId,
      gradedAt,
    });

    const updatedSubmission =
      await db.orm.public.AssignmentSubmission.where({
        id: submission.id,
        assignmentId: assignment.id,
      }).first();

    if (!updatedSubmission) {
      return NextResponse.json(
        { error: "The grade was saved, but the updated submission could not be retrieved." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Assignment graded successfully.",
      submission: {
        id: updatedSubmission.id,
        assignmentId: updatedSubmission.assignmentId,
        studentId: updatedSubmission.studentId,
        marks: updatedSubmission.marks,
        feedback: updatedSubmission.feedback,
        gradedByUserId: updatedSubmission.gradedByUserId,
        gradedAt: updatedSubmission.gradedAt,
      },
    });
  } catch (error) {
    console.error("Failed to grade assignment submission.", error);

    return NextResponse.json(
      { error: "Unable to grade this submission right now." },
      { status: 500 },
    );
  }
}
