import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import { startCBTAttempt } from "@/lib/services/cbt-attempt.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
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
        { error: "Invalid attempt request." },
        { status: 400 },
      );
    }

    const assessmentId = (body as Record<string, unknown>).assessmentId;

    if (
      typeof assessmentId !== "number" ||
      !Number.isSafeInteger(assessmentId) ||
      assessmentId <= 0
    ) {
      return NextResponse.json(
        { error: "A valid assessment ID is required." },
        { status: 400 },
      );
    }

    const attempt = await startCBTAttempt({
      userId,
      schoolId,
      assessmentId,
    });

    return NextResponse.json(
      {
        message: "CBT attempt started successfully.",
        attempt,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to start CBT attempt:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start the CBT attempt.",
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
