import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ContentType = "CLASS_NOTE" | "ASSIGNMENT" | "GRADE" | "RESULT";

function isContentType(value: unknown): value is ContentType {
  return (
    value === "CLASS_NOTE" ||
    value === "ASSIGNMENT" ||
    value === "GRADE" ||
    value === "RESULT"
  );
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

export async function POST(request: Request) {
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
      return jsonResponse(
        { error: "Valid student and school context are required." },
        400,
      );
    }

    const user = await db.orm.public.User.where({
      id: userId,
    }).first();

    if (!user || !user.isActive || user.mustChangePassword) {
      return jsonResponse(
        { error: "Your account cannot access student content." },
        403,
      );
    }

    const student = await db.orm.public.Student.where({
      userId,
    }).first();

    if (!student || student.schoolId !== schoolId || !student.isActive) {
      return jsonResponse({ error: "Student profile not found." }, 403);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        { error: "A valid JSON request body is required." },
        400,
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("contentType" in body) ||
      !("contentId" in body)
    ) {
      return jsonResponse(
        { error: "Content type and content ID are required." },
        400,
      );
    }

    const { contentType, contentId } = body;

    if (
      !isContentType(contentType) ||
      typeof contentId !== "number" ||
      !Number.isSafeInteger(contentId) ||
      contentId <= 0
    ) {
      return jsonResponse(
        { error: "A valid content type and positive content ID are required." },
        400,
      );
    }

    if (!student.classId) {
      return jsonResponse(
        { error: "You must be assigned to a class first." },
        403,
      );
    }

    let viewedVersion: string;

    if (contentType === "CLASS_NOTE") {
      const note = await db.orm.public.ClassNote.where({
        id: contentId,
        schoolId,
        classId: student.classId,
        isPublished: true,
      }).first();

      if (!note) {
        return jsonResponse({ error: "Published class note not found." }, 404);
      }

      viewedVersion = JSON.stringify({
        updatedAt: note.updatedAt,
        publishedAt: note.publishedAt,
        title: note.title,
        content: note.content,
      });
    } else if (contentType === "ASSIGNMENT") {
      const assignment = await db.orm.public.Assignment.where({
        id: contentId,
        schoolId,
        classId: student.classId,
        isPublished: true,
      }).first();

      if (!assignment) {
        return jsonResponse({ error: "Published assignment not found." }, 404);
      }

      viewedVersion = JSON.stringify({
        updatedAt: assignment.updatedAt,
        publishedAt: assignment.publishedAt,
        title: assignment.title,
        instructions: assignment.instructions,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore,
      });
    } else if (contentType === "GRADE") {
      const assignment = await db.orm.public.Assignment.where({
        id: contentId,
        schoolId,
        classId: student.classId,
        isPublished: true,
      }).first();

      if (!assignment) {
        return jsonResponse({ error: "Published assignment not found." }, 404);
      }

      const submission = await db.orm.public.AssignmentSubmission.where({
        assignmentId: assignment.id,
        studentId: student.id,
      }).first();

      if (
        !submission ||
        submission.submittedAt === null ||
        submission.marks === null
      ) {
        return jsonResponse(
          { error: "No graded submission is available to view." },
          404,
        );
      }

      viewedVersion = JSON.stringify({
        assignmentId: assignment.id,
        submissionId: submission.id,
        updatedAt: submission.updatedAt,
        gradedAt: submission.gradedAt,
        marks: submission.marks,
        feedback: submission.feedback,
      });
    } else {
      const publication = await db.orm.public.ReportPublication.where({
        id: contentId,
        schoolId,
        classId: student.classId,
        isPublished: true,
      }).first();

      if (!publication) {
        return jsonResponse({ error: "Published report not found." }, 404);
      }

      const [subjectResultRecords, termResultRecords] = await Promise.all([
        db.orm.public.SubjectResult.where({
          studentId: student.id,
        }).all(),

        db.orm.public.StudentTermResult.where({
          studentId: student.id,
        }).all(),
      ]);

      const subjectResults = subjectResultRecords
        .filter(
          (result) =>
            result.schoolId === schoolId &&
            result.classId === student.classId &&
            result.termId === publication.termId &&
            result.reportType === publication.reportType,
        )
        .map((result) => ({
          id: result.id,
          subjectId: result.subjectId,
          totalScore: result.totalScore,
          percentageScore: result.percentageScore,
          grade: result.grade,
          remark: result.remark,
          updatedAt: result.updatedAt,
        }))
        .sort((a, b) => a.id - b.id);

      const overallResult = termResultRecords.find(
        (result) =>
          result.schoolId === schoolId &&
          result.classId === student.classId &&
          result.termId === publication.termId &&
          result.reportType === publication.reportType,
      );

      if (subjectResults.length === 0 && !overallResult) {
        return jsonResponse(
          { error: "No results are available in this report yet." },
          404,
        );
      }

      viewedVersion = JSON.stringify({
        publicationUpdatedAt: publication.updatedAt,
        publishedAt: publication.publishedAt,
        reportType: publication.reportType,
        termId: publication.termId,
        subjects: subjectResults,
        overallResult: overallResult
          ? {
              id: overallResult.id,
              totalScore: overallResult.totalScore,
              averageScore: overallResult.averageScore,
              position: overallResult.position,
              grade: overallResult.grade,
              remark: overallResult.remark,
              updatedAt: overallResult.updatedAt,
            }
          : null,
      });
    }

    const existingRead = await db.orm.public.StudentContentRead.where({
      studentId: student.id,
      contentType,
      contentId,
    }).first();

    const viewedAt = new Date().toISOString();

    if (existingRead) {
      await db.orm.public.StudentContentRead.where({
        id: existingRead.id,
        studentId: student.id,
      }).update({
        viewedVersion,
        viewedAt,
      });
    } else {
      await db.orm.public.StudentContentRead.create({
        studentId: student.id,
        contentType,
        contentId,
        viewedVersion,
        viewedAt,
      });
    }

    return jsonResponse({
      success: true,
      contentType,
      contentId,
      viewedAt,
    });
  } catch (error) {
    console.error("Failed to record student content view.", error);

    return jsonResponse(
      { error: "Unable to record this content view right now." },
      500,
    );
  }
}
