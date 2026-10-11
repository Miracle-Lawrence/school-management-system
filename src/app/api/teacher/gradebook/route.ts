import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import { recordAssessmentScore } from "@/lib/services/assessment.service";
import { db } from "@/prisma/db";

type GradebookScoreInput = {
  assessmentId: number;
  studentId: number;
  score: number | null;
};

type GradebookRequestBody = {
  classId: number;
  subjectId: number;
  termId: number;
  scores: GradebookScoreInput[];
};

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["TEACHER"]);
    const schoolId = session.user.schoolId;
    const userId = Number(session.user.id);

    if (!schoolId) {
      return NextResponse.json(
        { message: "School context is required." },
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

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 },
      );
    }

    const data = body as Partial<GradebookRequestBody>;

    if (
      !isPositiveInteger(data.classId) ||
      !isPositiveInteger(data.subjectId) ||
      !isPositiveInteger(data.termId) ||
      !Array.isArray(data.scores) ||
      data.scores.length === 0 ||
      data.scores.length > 5000
    ) {
      return NextResponse.json(
        { message: "Invalid gradebook selection or score list." },
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

    const assignments = await db.orm.public.TeacherAssignment.where((item) =>
      item.teacherId.eq(teacher.id),
    ).all();

    const isAssigned = assignments.some(
      (assignment) =>
        assignment.schoolId === schoolId &&
        assignment.classId === data.classId &&
        assignment.subjectId === data.subjectId,
    );

    if (!isAssigned) {
      return NextResponse.json(
        { message: "You are not assigned to this class and subject." },
        { status: 403 },
      );
    }

    const [schoolClass, subject, allTerms, sessions, allAssessments] =
      await Promise.all([
        db.orm.public.SchoolClass.where((item) =>
          item.id.eq(data.classId!),
        ).first(),
        db.orm.public.Subject.where((item) =>
          item.id.eq(data.subjectId!),
        ).first(),
        db.orm.public.Term.all(),
        db.orm.public.AcademicSession.where((item) =>
          item.schoolId.eq(schoolId),
        ).all(),
        db.orm.public.Assessment.where((item) =>
          item.schoolId.eq(schoolId),
        ).all(),
      ]);

    const term = allTerms.find((item) => item.id === data.termId);

    if (
      !schoolClass ||
      schoolClass.schoolId !== schoolId ||
      !subject ||
      subject.schoolId !== schoolId ||
      !term ||
      !sessions.some((item) => item.id === term.sessionId)
    ) {
      return NextResponse.json(
        { message: "Invalid class, subject, or academic term." },
        { status: 400 },
      );
    }

    const classSubjects = await db.orm.public.ClassSubject.where((item) =>
      item.classId.eq(data.classId!),
    ).all();

    if (
      !classSubjects.some(
        (item) =>
          item.schoolId === schoolId && item.subjectId === data.subjectId,
      )
    ) {
      return NextResponse.json(
        { message: "This subject is not assigned to the selected class." },
        { status: 400 },
      );
    }

    const validAssessments = allAssessments.filter(
      (assessment) =>
        assessment.schoolId === schoolId &&
        assessment.classId === data.classId &&
        assessment.subjectId === data.subjectId &&
        assessment.termId === data.termId,
    );

    const assessmentById = new Map(
      validAssessments.map((assessment) => [assessment.id, assessment]),
    );

    const allStudents = await db.orm.public.Student.where((item) =>
      item.schoolId.eq(schoolId),
    ).all();

    const activeStudentIds = new Set(
      allStudents
        .filter(
          (student) => student.isActive && student.classId === data.classId,
        )
        .map((student) => student.id),
    );

    const seenKeys = new Set<string>();

    for (const item of data.scores) {
      if (
        !item ||
        typeof item !== "object" ||
        !isPositiveInteger(item.assessmentId) ||
        !isPositiveInteger(item.studentId) ||
        (item.score !== null &&
          (typeof item.score !== "number" || !Number.isFinite(item.score)))
      ) {
        return NextResponse.json(
          { message: "One or more submitted scores are invalid." },
          { status: 400 },
        );
      }

      const key = `${item.assessmentId}:${item.studentId}`;

      if (seenKeys.has(key)) {
        return NextResponse.json(
          { message: "Duplicate student-assessment entries were submitted." },
          { status: 400 },
        );
      }

      seenKeys.add(key);

      const assessment = assessmentById.get(item.assessmentId);

      if (!assessment || !activeStudentIds.has(item.studentId)) {
        return NextResponse.json(
          {
            message:
              "A submitted assessment or student is outside this gradebook.",
          },
          { status: 400 },
        );
      }

      if (
        item.score !== null &&
        (item.score < 0 || item.score > assessment.maxScore)
      ) {
        return NextResponse.json(
          {
            message: `Score for "${assessment.title}" must be between 0 and ${assessment.maxScore}.`,
          },
          { status: 400 },
        );
      }
    }

    // Pre-validation completes before any writes. Blank values are skipped.
    let savedCount = 0;

    for (const item of data.scores) {
      if (item.score === null) {
        continue;
      }

      await recordAssessmentScore({
        schoolId,
        assessmentId: item.assessmentId,
        studentId: item.studentId,
        score: item.score,
      });

      savedCount += 1;
    }

    return NextResponse.json({
      message: "Gradebook scores saved successfully.",
      savedCount,
    });
  } catch (error) {
    console.error("Teacher gradebook save error:", error);

    return NextResponse.json(
      { message: "Unable to save gradebook scores. Please try again." },
      { status: 500 },
    );
  }
}
