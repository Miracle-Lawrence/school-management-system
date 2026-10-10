import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import {
  deleteAssessment,
  updateAssessment,
} from "@/lib/services/assessment.service";
import { updateAssessmentSchema } from "@/lib/validation/assessment";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

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

    const validation = updateAssessmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Please correct the assessment details.",
          issues: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = validation.data;

    const assessment = await updateAssessment({
      schoolId,
      assessmentId,
      classId: data.classId,
      subjectId: data.subjectId,
      termId: data.termId,
      title: data.title,
      type: data.type,
      maxScore: data.maxScore,
      weight: data.weight,
      date: data.date || null,
      description: data.description || null,
    });

    return NextResponse.json({
      message: "Assessment updated successfully.",
      assessment,
    });
  } catch (error) {
    console.error("Assessment update error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update assessment.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

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

    await deleteAssessment(schoolId, assessmentId);

    return NextResponse.json({
      message: "Assessment deleted successfully.",
    });
  } catch (error) {
    console.error("Assessment deletion error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete assessment.",
      },
      { status: 400 },
    );
  }
}
