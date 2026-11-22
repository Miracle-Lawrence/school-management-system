import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import { publishCBTActivity } from "@/lib/services/cbt-publishing.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ assessmentId: string }>;
};

function parsePositiveId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0
    ? parsed
    : null;
}

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

  return { userId, schoolId, role: session.user.role };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await requireApiRole([
      "TEACHER",
      "SCHOOL_ADMIN",
      "SCHOOL_OWNER",
    ]);

    if (session instanceof NextResponse) return session;

    const context = getUserContext(session);

    if (!context) {
      return NextResponse.json(
        { error: "Valid user and school context are required." },
        { status: 400 },
      );
    }

    const { assessmentId: idParam } = await params;
    const assessmentId = parsePositiveId(idParam);

    if (assessmentId === null) {
      return NextResponse.json(
        { error: "Invalid assessment ID." },
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

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Invalid CBT publishing request." },
        { status: 400 },
      );
    }

    if (
      Object.keys(body).some((key) => key !== "questionIds")
    ) {
      return NextResponse.json(
        { error: "The request contains unsupported fields." },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(body.questionIds) ||
      body.questionIds.length === 0 ||
      !body.questionIds.every(
        (id) =>
          typeof id === "number" &&
          Number.isSafeInteger(id) &&
          id > 0,
      )
    ) {
      return NextResponse.json(
        { error: "Provide a non-empty array of valid question IDs." },
        { status: 400 },
      );
    }

    const questionIds = body.questionIds as number[];

    if (new Set(questionIds).size !== questionIds.length) {
      return NextResponse.json(
        { error: "Duplicate question IDs are not allowed." },
        { status: 400 },
      );
    }

    const result = await publishCBTActivity({
      ...context,
      assessmentId,
      questionIds,
    });

    return NextResponse.json(
      {
        message: "CBT assessment published successfully.",
        ...result,
      },
      {
        status: 200,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    console.error("Failed to publish CBT assessment:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to publish CBT assessment.",
      },
      { status: 400 },
    );
  }
}
