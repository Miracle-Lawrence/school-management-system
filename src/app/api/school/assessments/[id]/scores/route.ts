import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import {
  getAssessmentById,
  getAssessmentScores,
  recordAssessmentScore,
} from "@/lib/services/assessment.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type AuthorizedAssessmentContext = {
  schoolId: number;
  assessmentId: number;
};

function parsePositiveId(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }

  if (typeof value === "string" && !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function authorizeAssessmentAccess(
  schoolId: number,
  userId: number,
  role: string,
  assessmentId: number,
): Promise<AuthorizedAssessmentContext | null> {
  const assessment = await getAssessmentById(schoolId, assessmentId);

  // School owners and administrators can access assessments within their school.
  if (role === "SCHOOL_OWNER" || role === "SCHOOL_ADMIN") {
    return { schoolId, assessmentId };
  }

  if (role !== "TEACHER") {
    return null;
  }

  const teacher = await db.orm.public.Teacher.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    return null;
  }

  const assignments = await db.orm.public.TeacherAssignment.where((item) =>
    item.teacherId.eq(teacher.id),
  ).all();

  const isAssigned = assignments.some(
    (assignment) =>
      assignment.schoolId === schoolId &&
      assignment.classId === assessment.classId &&
      assignment.subjectId === assessment.subjectId,
  );

  if (!isAssigned) {
    return null;
  }

  return { schoolId, assessmentId };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await requireRole([
    "SCHOOL_OWNER",
    "SCHOOL_ADMIN",
    "TEACHER",
  ]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    return NextResponse.json(
      { error: "School context is required." },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const assessmentId = parsePositiveId(id);

    if (assessmentId === null) {
      return NextResponse.json(
        { error: "Invalid assessment ID." },
        { status: 400 },
      );
    }

    const access = await authorizeAssessmentAccess(
      schoolId,
      Number(session.user.id),
      session.user.role,
      assessmentId,
    );

    if (!access) {
      return NextResponse.json(
        { error: "You are not authorized to access this assessment." },
        { status: 403 },
      );
    }

    const scores = await getAssessmentScores(schoolId, assessmentId);

    return NextResponse.json(
      { scores },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Assessment scores lookup error:", error);

    return NextResponse.json(
      { error: "Failed to load assessment scores." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await requireRole([
    "SCHOOL_OWNER",
    "SCHOOL_ADMIN",
    "TEACHER",
  ]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    return NextResponse.json(
      { error: "School context is required." },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const assessmentId = parsePositiveId(id);

    if (assessmentId === null) {
      return NextResponse.json(
        { error: "Invalid assessment ID." },
        { status: 400 },
      );
    }

    const access = await authorizeAssessmentAccess(
      schoolId,
      Number(session.user.id),
      session.user.role,
      assessmentId,
    );

    if (!access) {
      return NextResponse.json(
        {
          error: "You are not authorized to record scores for this assessment.",
        },
        { status: 403 },
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

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Invalid score request." },
        { status: 400 },
      );
    }

    const studentId = parsePositiveId(body.studentId);

    if (
      studentId === null ||
      typeof body.score !== "number" ||
      !Number.isFinite(body.score)
    ) {
      return NextResponse.json(
        { error: "A valid student ID and numeric score are required." },
        { status: 400 },
      );
    }

    if (
      body.remarks !== undefined &&
      body.remarks !== null &&
      typeof body.remarks !== "string"
    ) {
      return NextResponse.json(
        { error: "Remarks must be text." },
        { status: 400 },
      );
    }

    const remarks =
      typeof body.remarks === "string"
        ? body.remarks.trim() || undefined
        : undefined;

    const savedScore = await recordAssessmentScore({
      schoolId,
      assessmentId,
      studentId,
      score: body.score,
      remarks,
    });

    return NextResponse.json(
      {
        message: "Student score saved successfully.",
        score: savedScore,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Assessment score recording error:", error);

    return NextResponse.json(
      { error: "Failed to save student score." },
      { status: 500 },
    );
  }
}
