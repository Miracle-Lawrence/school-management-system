import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import {
  createCBTActivityType,
  getCBTActivityTypes,
} from "@/lib/services/cbt-activity-type.service";

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

  return { userId, schoolId, role: session.user.role };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const inactiveParam = searchParams.get("includeInactive");

    if (
      inactiveParam !== null &&
      inactiveParam !== "true" &&
      inactiveParam !== "false"
    ) {
      return NextResponse.json(
        { error: "Invalid includeInactive filter." },
        { status: 400 },
      );
    }

    const activityTypes = await getCBTActivityTypes({
      ...context,
      includeInactive: inactiveParam === "true",
    });

    return NextResponse.json(
      { activityTypes },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Failed to load CBT activity types:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load activity types.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiRole([
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
        { error: "Invalid activity type request." },
        { status: 400 },
      );
    }

    if (
      typeof body.name !== "string" ||
      !body.name.trim()
    ) {
      return NextResponse.json(
        { error: "Activity type name is required." },
        { status: 400 },
      );
    }

    if (
      body.description !== undefined &&
      body.description !== null &&
      typeof body.description !== "string"
    ) {
      return NextResponse.json(
        { error: "Activity type description must be text." },
        { status: 400 },
      );
    }

    const activityType = await createCBTActivityType({
      ...context,
      name: body.name,
      description: body.description as string | undefined,
    });

    return NextResponse.json(
      {
        message: "Activity type created successfully.",
        activityType,
      },
      {
        status: 201,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    console.error("Failed to create CBT activity type:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create activity type.",
      },
      { status: 400 },
    );
  }
}
