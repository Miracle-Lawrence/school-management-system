import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import {
  deactivateCBTActivityType,
  updateCBTActivityType,
} from "@/lib/services/cbt-activity-type.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ activityTypeId: string }>;
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

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
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

    const { activityTypeId: idParam } = await params;
    const activityTypeId = parsePositiveId(idParam);

    if (activityTypeId === null) {
      return NextResponse.json(
        { error: "Invalid activity type ID." },
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
        { error: "Invalid activity type update request." },
        { status: 400 },
      );
    }

    const allowedFields = ["name", "description", "isActive"];

    if (
      Object.keys(body).length === 0 ||
      Object.keys(body).some((key) => !allowedFields.includes(key))
    ) {
      return NextResponse.json(
        { error: "Provide valid activity type fields to update." },
        { status: 400 },
      );
    }

    if (
      body.name !== undefined &&
      (
        typeof body.name !== "string" ||
        !body.name.trim()
      )
    ) {
      return NextResponse.json(
        { error: "Activity type name must be non-empty text." },
        { status: 400 },
      );
    }

    if (
      body.description !== undefined &&
      body.description !== null &&
      typeof body.description !== "string"
    ) {
      return NextResponse.json(
        { error: "Activity type description must be text or null." },
        { status: 400 },
      );
    }

    if (
      body.isActive !== undefined &&
      typeof body.isActive !== "boolean"
    ) {
      return NextResponse.json(
        { error: "isActive must be a boolean." },
        { status: 400 },
      );
    }

    const activityType = await updateCBTActivityType({
      ...context,
      activityTypeId,
      name: body.name as string | undefined,
      description: body.description as string | null | undefined,
      isActive: body.isActive as boolean | undefined,
    });

    return NextResponse.json(
      {
        message: "Activity type updated successfully.",
        activityType,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Failed to update CBT activity type:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update activity type.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
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

    const { activityTypeId: idParam } = await params;
    const activityTypeId = parsePositiveId(idParam);

    if (activityTypeId === null) {
      return NextResponse.json(
        { error: "Invalid activity type ID." },
        { status: 400 },
      );
    }

    const activityType = await deactivateCBTActivityType({
      ...context,
      activityTypeId,
    });

    return NextResponse.json(
      {
        message: "Activity type deactivated successfully.",
        activityType,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Failed to deactivate CBT activity type:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to deactivate activity type.",
      },
      { status: 400 },
    );
  }
}
