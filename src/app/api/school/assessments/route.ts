import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import {
  createAssessment,
  getAssessments,
} from "@/lib/services/assessment.service";
import { createAssessmentSchema } from "@/lib/validation/assessment";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);

    const classIdParam = searchParams.get("classId");
    const subjectIdParam = searchParams.get("subjectId");
    const termIdParam = searchParams.get("termId");

    const classId = classIdParam === null ? undefined : Number(classIdParam);

    const subjectId =
      subjectIdParam === null ? undefined : Number(subjectIdParam);

    const termId = termIdParam === null ? undefined : Number(termIdParam);

    for (const id of [classId, subjectId, termId]) {
      if (id !== undefined && (!Number.isInteger(id) || id <= 0)) {
        return NextResponse.json(
          { error: "Invalid assessment filter." },
          { status: 400 },
        );
      }
    }

    const assessments = await getAssessments({
      schoolId,
      classId,
      subjectId,
      termId,
    });

    return NextResponse.json({ assessments });
  } catch (error) {
    console.error("Assessment lookup error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load assessments.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
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

    const createdById = Number(session.user.id);

    if (!Number.isInteger(createdById) || createdById <= 0) {
      return NextResponse.json(
        { error: "Invalid user account." },
        { status: 400 },
      );
    }

    const body = await request.json();

    const validation = createAssessmentSchema.safeParse(body);

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

   const assessment = await createAssessment({
     schoolId,
     classId: data.classId,
     subjectId: data.subjectId,
     termId: data.termId,
     createdById,
     title: data.title,
     type: data.type,
     maxScore: data.maxScore,
     weight: data.weight,
     date: data.date || undefined,
     description: data.description || undefined,
   });

    return NextResponse.json(
      {
        message: "Assessment created successfully.",
        assessment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Assessment creation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create assessment.",
      },
      { status: 400 },
    );
  }
}
