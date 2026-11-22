import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import {
  createCBTSettings,
  getCBTSettings,
  updateCBTSettings,
} from "@/lib/services/cbt-settings.service";

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

const reportModes = ["AUTOMATIC", "MANUAL", "EXCLUDED"] as const;

export async function GET(
  _request: Request,
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

    const settings = await getCBTSettings({
      ...context,
      assessmentId,
    });

    if (!settings) {
      return NextResponse.json(
        { error: "CBT settings have not been configured for this assessment." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { settings },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Failed to load CBT settings:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load CBT settings.",
      },
      { status: 400 },
    );
  }
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
        { error: "Invalid CBT settings request." },
        { status: 400 },
      );
    }

    const allowedFields = [
      "activityTypeId",
      "reportMode",
      "durationMinutes",
      "opensAt",
      "closesAt",
      "maxAttempts",
      "shuffleQuestions",
      "shuffleOptions",
      "allowBackNavigation",
      "instructions",
    ];

    if (Object.keys(body).some((key) => !allowedFields.includes(key))) {
      return NextResponse.json(
        { error: "The request contains unsupported settings fields." },
        { status: 400 },
      );
    }

    if (
      typeof body.durationMinutes !== "number" ||
      !Number.isInteger(body.durationMinutes) ||
      body.durationMinutes < 1 ||
      body.durationMinutes > 600
    ) {
      return NextResponse.json(
        { error: "Duration must be between 1 and 600 minutes." },
        { status: 400 },
      );
    }

    if (
      body.activityTypeId !== undefined &&
      body.activityTypeId !== null &&
      (
        typeof body.activityTypeId !== "number" ||
        !Number.isSafeInteger(body.activityTypeId) ||
        body.activityTypeId <= 0
      )
    ) {
      return NextResponse.json(
        { error: "Invalid activity type ID." },
        { status: 400 },
      );
    }

    if (
      body.reportMode !== undefined &&
      (
        typeof body.reportMode !== "string" ||
        !reportModes.includes(
          body.reportMode as (typeof reportModes)[number],
        )
      )
    ) {
      return NextResponse.json(
        { error: "Invalid CBT report mode." },
        { status: 400 },
      );
    }

    for (const field of ["opensAt", "closesAt"]) {
      const value = body[field];

      if (
        value !== undefined &&
        value !== null &&
        typeof value !== "string"
      ) {
        return NextResponse.json(
          { error: `${field} must be an ISO date string or null.` },
          { status: 400 },
        );
      }
    }

    if (
      body.maxAttempts !== undefined &&
      (
        typeof body.maxAttempts !== "number" ||
        !Number.isInteger(body.maxAttempts) ||
        body.maxAttempts < 1 ||
        body.maxAttempts > 20
      )
    ) {
      return NextResponse.json(
        { error: "Maximum attempts must be between 1 and 20." },
        { status: 400 },
      );
    }

    for (const field of [
      "shuffleQuestions",
      "shuffleOptions",
      "allowBackNavigation",
    ]) {
      if (
        body[field] !== undefined &&
        typeof body[field] !== "boolean"
      ) {
        return NextResponse.json(
          { error: `${field} must be a boolean.` },
          { status: 400 },
        );
      }
    }

    if (
      body.instructions !== undefined &&
      body.instructions !== null &&
      typeof body.instructions !== "string"
    ) {
      return NextResponse.json(
        { error: "Instructions must be text or null." },
        { status: 400 },
      );
    }

    const settings = await createCBTSettings({
      ...context,
      assessmentId,
      activityTypeId: body.activityTypeId as number | null | undefined,
      reportMode: body.reportMode as
        | "AUTOMATIC"
        | "MANUAL"
        | "EXCLUDED"
        | undefined,
      durationMinutes: body.durationMinutes,
      opensAt: body.opensAt as string | null | undefined,
      closesAt: body.closesAt as string | null | undefined,
      maxAttempts: body.maxAttempts as number | undefined,
      shuffleQuestions: body.shuffleQuestions as boolean | undefined,
      shuffleOptions: body.shuffleOptions as boolean | undefined,
      allowBackNavigation: body.allowBackNavigation as boolean | undefined,
      instructions: body.instructions as string | null | undefined,
    });

    return NextResponse.json(
      {
        message: "CBT settings created successfully.",
        settings,
      },
      {
        status: 201,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    console.error("Failed to create CBT settings:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create CBT settings.",
      },
      { status: 400 },
    );
  }
}

export async function PATCH(
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

    if (!isRecord(body) || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "Provide at least one CBT setting to update." },
        { status: 400 },
      );
    }

    const allowedFields = [
      "activityTypeId",
      "reportMode",
      "durationMinutes",
      "opensAt",
      "closesAt",
      "maxAttempts",
      "shuffleQuestions",
      "shuffleOptions",
      "allowBackNavigation",
      "instructions",
    ];

    if (Object.keys(body).some((key) => !allowedFields.includes(key))) {
      return NextResponse.json(
        { error: "The request contains unsupported settings fields." },
        { status: 400 },
      );
    }

    if (
      body.durationMinutes !== undefined &&
      (
        typeof body.durationMinutes !== "number" ||
        !Number.isInteger(body.durationMinutes) ||
        body.durationMinutes < 1 ||
        body.durationMinutes > 600
      )
    ) {
      return NextResponse.json(
        { error: "Duration must be between 1 and 600 minutes." },
        { status: 400 },
      );
    }

    if (
      body.activityTypeId !== undefined &&
      body.activityTypeId !== null &&
      (
        typeof body.activityTypeId !== "number" ||
        !Number.isSafeInteger(body.activityTypeId) ||
        body.activityTypeId <= 0
      )
    ) {
      return NextResponse.json(
        { error: "Invalid activity type ID." },
        { status: 400 },
      );
    }

    if (
      body.reportMode !== undefined &&
      (
        typeof body.reportMode !== "string" ||
        !reportModes.includes(
          body.reportMode as (typeof reportModes)[number],
        )
      )
    ) {
      return NextResponse.json(
        { error: "Invalid CBT report mode." },
        { status: 400 },
      );
    }

    for (const field of ["opensAt", "closesAt"]) {
      const value = body[field];

      if (
        value !== undefined &&
        value !== null &&
        typeof value !== "string"
      ) {
        return NextResponse.json(
          { error: `${field} must be an ISO date string or null.` },
          { status: 400 },
        );
      }
    }

    if (
      body.maxAttempts !== undefined &&
      (
        typeof body.maxAttempts !== "number" ||
        !Number.isInteger(body.maxAttempts) ||
        body.maxAttempts < 1 ||
        body.maxAttempts > 20
      )
    ) {
      return NextResponse.json(
        { error: "Maximum attempts must be between 1 and 20." },
        { status: 400 },
      );
    }

    for (const field of [
      "shuffleQuestions",
      "shuffleOptions",
      "allowBackNavigation",
    ]) {
      if (
        body[field] !== undefined &&
        typeof body[field] !== "boolean"
      ) {
        return NextResponse.json(
          { error: `${field} must be a boolean.` },
          { status: 400 },
        );
      }
    }

    if (
      body.instructions !== undefined &&
      body.instructions !== null &&
      typeof body.instructions !== "string"
    ) {
      return NextResponse.json(
        { error: "Instructions must be text or null." },
        { status: 400 },
      );
    }

    const settings = await updateCBTSettings({
      ...context,
      assessmentId,
      activityTypeId: body.activityTypeId as number | null | undefined,
      reportMode: body.reportMode as
        | "AUTOMATIC"
        | "MANUAL"
        | "EXCLUDED"
        | undefined,
      durationMinutes: body.durationMinutes as number | undefined,
      opensAt: body.opensAt as string | null | undefined,
      closesAt: body.closesAt as string | null | undefined,
      maxAttempts: body.maxAttempts as number | undefined,
      shuffleQuestions: body.shuffleQuestions as boolean | undefined,
      shuffleOptions: body.shuffleOptions as boolean | undefined,
      allowBackNavigation: body.allowBackNavigation as boolean | undefined,
      instructions: body.instructions as string | null | undefined,
    });

    return NextResponse.json(
      {
        message: "CBT settings updated successfully.",
        settings,
      },
      {
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    console.error("Failed to update CBT settings:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update CBT settings.",
      },
      { status: 400 },
    );
  }
}
