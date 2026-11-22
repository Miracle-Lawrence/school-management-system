import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import { submitCBTAttempt } from "@/lib/services/cbt-attempt.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ attemptId: string }>;
};

function parsePositiveId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function POST(_request: Request, { params }: RouteContext) {
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

    const { attemptId: attemptIdParam } = await params;
    const attemptId = parsePositiveId(attemptIdParam);

    if (attemptId === null) {
      return NextResponse.json(
        { error: "Invalid attempt ID." },
        { status: 400 },
      );
    }

    const result = await submitCBTAttempt({
      userId,
      schoolId,
      attemptId,
    });

    return NextResponse.json(
      {
        message: "CBT attempt submitted successfully.",
        result,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to submit CBT attempt:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit your CBT attempt.",
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
