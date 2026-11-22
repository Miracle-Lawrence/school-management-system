import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import {
  createCBTQuestionBank,
  getCBTQuestionBanks,
} from "@/lib/services/cbt-question-bank.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getUserContext(session: {
  user: { id: string; schoolId?: number | null; role: string };
}) {
  const userId = Number(session.user.id);
  const schoolId = Number(session.user.schoolId);

  if (
    !Number.isSafeInteger(userId) || userId <= 0 ||
    !Number.isSafeInteger(schoolId) || schoolId <= 0
  ) {
    return null;
  }

  return {
    userId,
    schoolId,
    role: session.user.role,
  };
}

export async function GET(request: Request) {
  try {
    const session = await requireApiRole([
      "TEACHER",
      "SCHOOL_ADMIN",
      "SCHOOL_OWNER",
    ]);

    if (session instanceof NextResponse) {
      return session;
    }

    const context = getUserContext(session);

    if (!context) {
      return NextResponse.json(
        { error: "Valid user and school context are required." },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const subjectParam = searchParams.get("subjectId");
    const includeInactiveParam = searchParams.get("includeInactive");

    let subjectId: number | undefined;

    if (subjectParam !== null) {
      subjectId = Number(subjectParam);

      if (!Number.isSafeInteger(subjectId) || subjectId <= 0) {
        return NextResponse.json(
          { error: "Invalid subject ID." },
          { status: 400 },
        );
      }
    }

    if (
      includeInactiveParam !== null &&
      includeInactiveParam !== "true" &&
      includeInactiveParam !== "false"
    ) {
      return NextResponse.json(
        { error: "Invalid includeInactive filter." },
        { status: 400 },
      );
    }

    const questionBanks = await getCBTQuestionBanks({
      ...context,
      subjectId,
      includeInactive: includeInactiveParam === "true",
    });

    return NextResponse.json(
      { questionBanks },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load CBT question banks:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load question banks.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiRole([
      "TEACHER",
      "SCHOOL_ADMIN",
      "SCHOOL_OWNER",
    ]);

    if (session instanceof NextResponse) {
      return session;
    }

    const context = getUserContext(session);

    if (!context) {
      return NextResponse.json(
        { error: "Valid user and school context are required." },
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
        { error: "Invalid question bank request." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    if (
      typeof data.subjectId !== "number" ||
      !Number.isSafeInteger(data.subjectId) ||
      data.subjectId <= 0
    ) {
      return NextResponse.json(
        { error: "A valid subject ID is required." },
        { status: 400 },
      );
    }

    if (typeof data.title !== "string") {
      return NextResponse.json(
        { error: "Question bank title is required." },
        { status: 400 },
      );
    }

    if (
      data.description !== undefined &&
      data.description !== null &&
      typeof data.description !== "string"
    ) {
      return NextResponse.json(
        { error: "Question bank description must be text." },
        { status: 400 },
      );
    }

    const questionBank = await createCBTQuestionBank({
      ...context,
      subjectId: data.subjectId,
      title: data.title,
      description: data.description as string | undefined,
    });

    return NextResponse.json(
      {
        message: "Question bank created successfully.",
        questionBank,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to create CBT question bank:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create question bank.",
      },
      { status: 400 },
    );
  }
}
