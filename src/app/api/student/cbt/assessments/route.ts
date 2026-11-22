import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import { getStudentCBTAssessments } from "@/lib/services/cbt-student.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireApiRole(["STUDENT"]);

    if (session instanceof NextResponse) {
      return session;
    }

    const userId = Number(session.user.id);
    const schoolId = Number(session.user.schoolId);

    if (
      !Number.isSafeInteger(userId) || userId <= 0 ||
      !Number.isSafeInteger(schoolId) || schoolId <= 0
    ) {
      return NextResponse.json(
        { error: "Valid student and school context are required." },
        { status: 400 },
      );
    }

    const assessments = await getStudentCBTAssessments({
      userId,
      schoolId,
    });

    return NextResponse.json(
      { assessments },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load student CBT assessments:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load CBT assessments.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  }
}
