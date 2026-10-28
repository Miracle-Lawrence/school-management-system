import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ContentType = "CLASS_NOTE" | "ASSIGNMENT" | "GRADE" | "RESULT";

type UnreadCounts = {
  classNotes: number;
  assignments: number;
  gradedAssignments: number;
  results: number;
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

function readKey(contentType: ContentType, contentId: number) {
  return `${contentType}:${contentId}`;
}

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

    if (
      !student ||
      student.schoolId !== schoolId ||
      !student.isActive
    ) {
      return jsonResponse(
        { error: "Student profile not found." },
        403,
      );
    }

    const counts: UnreadCounts = {
      classNotes: 0,
      assignments: 0,
      gradedAssignments: 0,
      results: 0,
    };

    if (!student.classId) {
      return jsonResponse({ counts });
    }

    const [
      noteRecords,
      assignmentRecords,
      submissionRecords,
      publicationRecords,
      subjectResultRecords,
      termResultRecords,
      readRecords,
    ] = await Promise.all([
      db.orm.public.ClassNote.where({
        schoolId,
        classId: student.classId,
        isPublished: true,
      }).all(),

      db.orm.public.Assignment.where({
        schoolId,
        classId: student.classId,
        isPublished: true,
      }).all(),

      db.orm.public.AssignmentSubmission.where({
        studentId: student.id,
      }).all(),

      db.orm.public.ReportPublication.where({
        schoolId,
        classId: student.classId,
        isPublished: true,
      }).all(),

      db.orm.public.SubjectResult.where({
        studentId: student.id,
      }).all(),

      db.orm.public.StudentTermResult.where({
        studentId: student.id,
      }).all(),

      db.orm.public.StudentContentRead.where({
        studentId: student.id,
      }).all(),
    ]);

    const viewedVersions = new Map<string, string>();

    for (const read of readRecords) {
      viewedVersions.set(
        readKey(read.contentType, read.contentId),
        read.viewedVersion,
      );
    }

    // Count class notes that are new or have changed since viewing.
    for (const note of noteRecords) {
      const currentVersion = JSON.stringify({
        updatedAt: note.updatedAt,
        publishedAt: note.publishedAt,
        title: note.title,
        content: note.content,
      });

      const previousVersion = viewedVersions.get(
        readKey("CLASS_NOTE", note.id),
      );

      if (previousVersion !== currentVersion) {
        counts.classNotes += 1;
      }
    }

    const submissionsByAssignmentId = new Map(
      submissionRecords.map((submission) => [
        submission.assignmentId,
        submission,
      ]),
    );

    // Assignment reads and grade reads are tracked independently.
    for (const assignment of assignmentRecords) {
      const assignmentVersion = JSON.stringify({
        updatedAt: assignment.updatedAt,
        publishedAt: assignment.publishedAt,
        title: assignment.title,
        instructions: assignment.instructions,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore,
      });

      const previousAssignmentVersion = viewedVersions.get(
        readKey("ASSIGNMENT", assignment.id),
      );

      if (previousAssignmentVersion !== assignmentVersion) {
        counts.assignments += 1;
      }

      const submission = submissionsByAssignmentId.get(assignment.id);

      if (
        !submission ||
        submission.submittedAt === null ||
        submission.marks === null
      ) {
        continue;
      }

      const gradeVersion = JSON.stringify({
        assignmentId: assignment.id,
        submissionId: submission.id,
        updatedAt: submission.updatedAt,
        gradedAt: submission.gradedAt,
        marks: submission.marks,
        feedback: submission.feedback,
      });

      const previousGradeVersion = viewedVersions.get(
        readKey("GRADE", assignment.id),
      );

      if (previousGradeVersion !== gradeVersion) {
        counts.gradedAssignments += 1;
      }
    }

    // Count published reports with results that have not been viewed
    // in their current version.
    for (const publication of publicationRecords) {
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
        continue;
      }

      const resultVersion = JSON.stringify({
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

      const previousResultVersion = viewedVersions.get(
        readKey("RESULT", publication.id),
      );

      if (previousResultVersion !== resultVersion) {
        counts.results += 1;
      }
    }

    return jsonResponse({ counts });
  } catch (error) {
    console.error(
      "Failed to calculate student content unread counts.",
      error,
    );

    return jsonResponse(
      { error: "Unable to load unread content counts right now." },
      500,
    );
  }
}
