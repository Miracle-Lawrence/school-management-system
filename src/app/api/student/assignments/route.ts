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
    const schoolId = session.user.schoolId;

    if (!Number.isSafeInteger(userId) || userId <= 0 || !schoolId) {
      return NextResponse.json(
        { error: "Valid student and school context are required." },
        { status: 400 },
      );
    }

    const user = await db.orm.public.User.where({ id: userId }).first();

    if (!user || !user.isActive || user.mustChangePassword) {
      return NextResponse.json(
        { error: "Your account cannot access assignments." },
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
          assignments: [],
          message: "You have not been assigned to a class yet.",
        },
        {
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    const assignmentRecords = await db.orm.public.Assignment.where({
      schoolId,
      classId: student.classId,
      isPublished: true,
    }).all();

    const submissionRecords = await db.orm.public.AssignmentSubmission.where({
      studentId: student.id,
    }).all();

    const submissionsByAssignment = new Map(
      submissionRecords.map((submission) => [
        submission.assignmentId,
        submission,
      ]),
    );

    const now = Date.now();

    const assignments = assignmentRecords
      .map((assignment) => {
        const submission = submissionsByAssignment.get(assignment.id) ?? null;

        const deadline = assignment.dueDate
          ? new Date(assignment.dueDate).getTime()
          : null;

        const hasBeenSubmitted =
          submission !== null && submission.submittedAt !== null;

        const isGraded =
          hasBeenSubmitted && submission.marks !== null;

        let status: "PENDING" | "SUBMITTED" | "GRADED" | "OVERDUE";

        if (isGraded) {
          status = "GRADED";
        } else if (hasBeenSubmitted) {
          status = "SUBMITTED";
        } else if (deadline !== null && deadline < now) {
          status = "OVERDUE";
        } else {
          status = "PENDING";
        }

        return {
          id: assignment.id,
          classId: assignment.classId,
          subjectId: assignment.subjectId,
          title: assignment.title,
          instructions: assignment.instructions,
          dueDate: assignment.dueDate,
          maxScore: assignment.maxScore,
          publishedAt: assignment.publishedAt,
          createdAt: assignment.createdAt,
          status,
          submission: submission
            ? {
                id: submission.id,
                answer: submission.answer,
                submittedAt: submission.submittedAt,
                marks: submission.marks,
                feedback: submission.feedback,
                gradedAt: submission.gradedAt,
              }
            : null,
        };
      })
      .sort((a, b) => {
        const aDeadline = a.dueDate
          ? new Date(a.dueDate).getTime()
          : Number.MAX_SAFE_INTEGER;

        const bDeadline = b.dueDate
          ? new Date(b.dueDate).getTime()
          : Number.MAX_SAFE_INTEGER;

        return aDeadline - bDeadline;
      });

    return NextResponse.json(
      { assignments },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load student assignments.", error);

    return NextResponse.json(
      { error: "Unable to load assignments right now." },
      { status: 500 },
    );
  }
}
