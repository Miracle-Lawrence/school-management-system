import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import { saveCBTAnswer } from "@/lib/services/cbt-attempt.service";

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

export async function PATCH(request: Request, { params }: RouteContext) {
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
        { error: "Invalid answer request." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    if (
      typeof data.questionId !== "number" ||
      !Number.isSafeInteger(data.questionId) ||
      data.questionId <= 0
    ) {
      return NextResponse.json(
        { error: "A valid question ID is required." },
        { status: 400 },
      );
    }

    if (
      data.selectedOptionIds !== undefined &&
      (
        !Array.isArray(data.selectedOptionIds) ||
        data.selectedOptionIds.some(
          (id) =>
            typeof id !== "number" ||
            !Number.isSafeInteger(id) ||
            id <= 0,
        )
      )
    ) {
      return NextResponse.json(
        { error: "Selected option IDs must be an array of valid IDs." },
        { status: 400 },
      );
    }

    if (
      data.answerText !== undefined &&
      data.answerText !== null &&
      typeof data.answerText !== "string"
    ) {
      return NextResponse.json(
        { error: "Written answers must be text." },
        { status: 400 },
      );
    }

    const result = await saveCBTAnswer({
      userId,
      schoolId,
      attemptId,
      questionId: data.questionId,
      selectedOptionIds: data.selectedOptionIds as number[] | undefined,
      answerText: data.answerText as string | null | undefined,
    });

    return NextResponse.json(
      {
        message: "Answer saved successfully.",
        result,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to save CBT answer:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save your answer.",
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
