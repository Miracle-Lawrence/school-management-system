import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ assignmentId: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session = await requireRole(["TEACHER"]);

    const userId = Number(session.user.id);
    const schoolId = session.user.schoolId;
    const { assignmentId: assignmentIdParam } = await context.params;
    const assignmentId = Number(assignmentIdParam);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      !schoolId ||
      !Number.isSafeInteger(assignmentId) ||
      assignmentId <= 0
    ) {
      return NextResponse.json(
        { error: "Valid teacher, school, and assignment details are required." },
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
        { error: "Assignment not found or you do not have permission to view it." },
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

    const students = await db.orm.public.Student.where({
      schoolId,
      classId: assignment.classId,
      isActive: true,
    }).all();

    const submissions = await db.orm.public.AssignmentSubmission.where({
      assignmentId: assignment.id,
    }).all();

    const submissionsByStudent = new Map(
      submissions.map((submission) => [
        submission.studentId,
        submission,
      ]),
    );

    const studentSubmissions = students
      .map((student) => {
        const submission =
          submissionsByStudent.get(student.id) ?? null;

        return {
          studentId: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          admissionNumber: student.admissionNumber,
          submission: submission
            ? {
                id: submission.id,
                answer: submission.answer,
                submittedAt: submission.submittedAt,
                marks: submission.marks,
                feedback: submission.feedback,
                gradedAt: submission.gradedAt,
                gradedByUserId: submission.gradedByUserId,
              }
            : null,
          status: !submission || !submission.submittedAt
            ? "NOT_SUBMITTED"
            : submission.marks !== null
              ? "GRADED"
              : "SUBMITTED",
        };
      })
      .sort((a, b) =>
        a.lastName.localeCompare(b.lastName) ||
        a.firstName.localeCompare(b.firstName),
      );

    return NextResponse.json(
      {
        assignment: {
          id: assignment.id,
          title: assignment.title,
          instructions: assignment.instructions,
          maxScore: assignment.maxScore,
          dueDate: assignment.dueDate,
          isPublished: assignment.isPublished,
        },
        submissions: studentSubmissions,
        summary: {
          totalStudents: studentSubmissions.length,
          submitted: studentSubmissions.filter(
            (item) => item.status === "SUBMITTED" ||
              item.status === "GRADED",
          ).length,
          graded: studentSubmissions.filter(
            (item) => item.status === "GRADED",
          ).length,
          notSubmitted: studentSubmissions.filter(
            (item) => item.status === "NOT_SUBMITTED",
          ).length,
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load assignment submissions.", error);

    return NextResponse.json(
      { error: "Unable to load assignment submissions right now." },
      { status: 500 },
    );
  }
}
