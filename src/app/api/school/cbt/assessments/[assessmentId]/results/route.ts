import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/authorization";
import { getCBTAssessmentResults } from "@/lib/services/cbt-teacher-results.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ assessmentId: string }>;
};

function parsePositiveId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await requireApiRole([
      "TEACHER",
      "SCHOOL_ADMIN",
      "SCHOOL_OWNER",
    ]);

    if (session instanceof NextResponse) return session;

    const userId = Number(session.user.id);
    const schoolId = Number(session.user.schoolId);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      !Number.isSafeInteger(schoolId) ||
      schoolId <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid user or school session." },
        { status: 401 },
      );
    }

    const { assessmentId: assessmentIdParam } = await params;
    const assessmentId = parsePositiveId(assessmentIdParam);

    if (!assessmentId) {
      return NextResponse.json(
        { error: "Invalid assessment ID." },
        { status: 400 },
      );
    }

    const results = await getCBTAssessmentResults({
      schoolId,
      userId,
      role: session.user.role,
      assessmentId,
    });

    return NextResponse.json(
      { results },
      {
        status: 200,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    console.error("Failed to load CBT assessment results:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load CBT assessment results.",
      },
      {
        status: 400,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
