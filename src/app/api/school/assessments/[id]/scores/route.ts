import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  getAssessmentScores,
  recordAssessmentScore,
} from "@/lib/services/assessment.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (
      session.user.role !== "SCHOOL_OWNER" &&
      session.user.role !== "SCHOOL_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { error: "School context is required." },
        { status: 400 },
      );
    }

    const { id } = await params;
    const assessmentId = Number(id);

    if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
      return NextResponse.json(
        { error: "Invalid assessment ID." },
        { status: 400 },
      );
    }

    const scores = await getAssessmentScores(schoolId, assessmentId);

    return NextResponse.json({ scores });
  } catch (error) {
    console.error("Assessment scores lookup error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load assessment scores.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (
      session.user.role !== "SCHOOL_OWNER" &&
      session.user.role !== "SCHOOL_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { error: "School context is required." },
        { status: 400 },
      );
    }

    const { id } = await params;
    const assessmentId = Number(id);

    if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
      return NextResponse.json(
        { error: "Invalid assessment ID." },
        { status: 400 },
      );
    }

    const body = await request.json();

    const studentId = Number(body.studentId);
    const score = Number(body.score);

    if (
      !Number.isInteger(studentId) ||
      studentId <= 0 ||
      !Number.isFinite(score)
    ) {
      return NextResponse.json(
        { error: "A valid student and score are required." },
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
      score,
      remarks,
    });

    return NextResponse.json(
      {
        message: "Student score saved successfully.",
        score: savedScore,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Assessment score recording error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save student score.",
      },
      { status: 400 },
    );
  }
}
