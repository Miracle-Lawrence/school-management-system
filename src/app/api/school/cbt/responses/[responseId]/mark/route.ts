import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import { markCBTTheoryResponse } from "@/lib/services/cbt-attempt.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ responseId: string }>;
};

function parsePositiveId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireApiRole([
      "TEACHER",
      "SCHOOL_ADMIN",
      "SCHOOL_OWNER",
    ]);

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
        { error: "Valid user and school context are required." },
        { status: 400 },
      );
    }

    const { responseId: responseIdParam } = await params;
    const responseId = parsePositiveId(responseIdParam);

    if (responseId === null) {
      return NextResponse.json(
        { error: "Invalid response ID." },
        { status: 400 },
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

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid marking request." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    if (
      typeof data.awardedMarks !== "number" ||
      !Number.isFinite(data.awardedMarks) ||
      data.awardedMarks < 0
    ) {
      return NextResponse.json(
        { error: "Awarded marks must be a valid non-negative number." },
        { status: 400 },
      );
    }

    if (
      data.feedback !== undefined &&
      data.feedback !== null &&
      typeof data.feedback !== "string"
    ) {
      return NextResponse.json(
        { error: "Feedback must be text." },
        { status: 400 },
      );
    }

    const result = await markCBTTheoryResponse({
      userId,
      schoolId,
      responseId,
      awardedMarks: data.awardedMarks,
      feedback: data.feedback as string | null | undefined,
    });

    return NextResponse.json(
      {
        message: result.fullyGraded
          ? "Response marked and attempt fully graded."
          : "Response marked. Other theory responses are still awaiting marking.",
        result,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to mark CBT theory response:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to mark the CBT response.",
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
