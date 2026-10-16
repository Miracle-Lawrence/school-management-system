import { db } from "@/prisma/db";
import {
  reportCommentSchema,
  type ReportCommentInput,
} from "@/lib/validation/report-comment";

type ReportType = "MID_TERM" | "TERMINAL";

async function validateReportCommentContext(
  schoolId: number,
  studentId: number,
  termId: number,
) {
  const student = await db.orm.public.Student.where((item) =>
    item.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    throw new Error("Invalid student.");
  }

  const term = await db.orm.public.Term.where((item) =>
    item.id.eq(termId),
  ).first();

  if (!term) {
    throw new Error("Term not found.");
  }

  const academicSession = await db.orm.public.AcademicSession.where((item) =>
    item.id.eq(term.sessionId),
  ).first();

  if (!academicSession || academicSession.schoolId !== schoolId) {
    throw new Error("Invalid term.");
  }

  return {
    student,
    term,
    academicSession,
  };
}

export async function getReportComment(
  schoolId: number,
  studentId: number,
  termId: number,
  reportType: ReportType = "TERMINAL",
) {
  const comments = await db.orm.public.ReportComment.where((item) =>
    item.studentId.eq(studentId),
  ).all();

  return (
    comments.find(
      (comment) =>
        comment.schoolId === schoolId &&
        comment.termId === termId &&
        comment.reportType === reportType,
    ) ?? null
  );
}


export async function saveReportComment(
  schoolId: number,
  input: ReportCommentInput,
) {
  const parsed = reportCommentSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid report comment.",
    );
  }

  const data = parsed.data;

  await validateReportCommentContext(schoolId, data.studentId, data.termId);

  const existingComment = await getReportComment(
    schoolId,
    data.studentId,
    data.termId,
    data.reportType,
  );

  const commentData: {
    schoolId: number;
    studentId: number;
    termId: number;
    reportType: ReportType;
    teacherComment?: string | null;
    principalComment?: string | null;
  } = {
    schoolId,
    studentId: data.studentId,
    termId: data.termId,
    reportType: data.reportType,
  };

  // Update only fields supplied by the caller.
  if (data.teacherComment !== undefined) {
    commentData.teacherComment = data.teacherComment.trim() || null;
  }

  if (data.principalComment !== undefined) {
    commentData.principalComment = data.principalComment.trim() || null;
  }

  if (existingComment) {
    return db.orm.public.ReportComment.where((item) =>
      item.id.eq(existingComment.id),
    ).update(commentData);
  }

  return db.orm.public.ReportComment.create({
    ...commentData,
    teacherComment: commentData.teacherComment ?? null,
    principalComment: commentData.principalComment ?? null,
  });
}

export async function deleteReportComment(schoolId: number, commentId: number) {
  const comment = await db.orm.public.ReportComment.where((item) =>
    item.id.eq(commentId),
  ).first();

  if (!comment || comment.schoolId !== schoolId) {
    throw new Error("Report comment not found.");
  }

  return db.orm.public.ReportComment.where((item) =>
    item.id.eq(commentId),
  ).delete();
}
