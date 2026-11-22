import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/authorization";
import { getStudentCBTAttempt } from "@/lib/services/cbt-student-attempt.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ attemptId: string }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  const session = await requireApiRole(["STUDENT"]);

  if (session instanceof NextResponse) {
    return session;
  }

  const { attemptId: rawAttemptId } = await context.params;
  const attemptId = Number(rawAttemptId);

  if (!Number.isSafeInteger(attemptId) || attemptId <= 0) {
    return NextResponse.json(
      { error: "Invalid attempt ID." },
      { status: 400 },
    );
  }

  try {
    const attempt = await getStudentCBTAttempt({
      userId: Number(session.user.id),
      schoolId: Number(session.user.schoolId),
      attemptId,
    });

    return NextResponse.json(
      { attempt },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load this CBT attempt.";

    return NextResponse.json(
      { error: message },
      {
        status: message.includes("not found") ? 404 : 400,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  }
}
