import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import {
  deactivateCBTQuestionBank,
  getCBTQuestionBankById,
  updateCBTQuestionBank,
} from "@/lib/services/cbt-question-bank.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ bankId: string }>;
};

function parsePositiveId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
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

  return {
    userId,
    schoolId,
    role: session.user.role,
  };
}

async function getBankId(params: RouteContext["params"]) {
  const { bankId } = await params;
  return parsePositiveId(bankId);
}

export async function GET(
  request: Request,
  { params }: RouteContext,
) {
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

    const bankId = await getBankId(params);

    if (bankId === null) {
      return NextResponse.json(
        { error: "Invalid question bank ID." },
        { status: 400 },
      );
    }

    const questionBank = await getCBTQuestionBankById({
      ...context,
      bankId,
    });

    return NextResponse.json(
      { questionBank },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load CBT question bank:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load question bank.",
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

    const bankId = await getBankId(params);

    if (bankId === null) {
      return NextResponse.json(
        { error: "Invalid question bank ID." },
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
        { error: "Invalid question bank update." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    if (
      data.title !== undefined &&
      typeof data.title !== "string"
    ) {
      return NextResponse.json(
        { error: "Question bank title must be text." },
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

    if (
      data.isActive !== undefined &&
      typeof data.isActive !== "boolean"
    ) {
      return NextResponse.json(
        { error: "isActive must be a boolean." },
        { status: 400 },
      );
    }

    const questionBank = await updateCBTQuestionBank({
      ...context,
      bankId,
      title: data.title as string | undefined,
      description: data.description as string | null | undefined,
      isActive: data.isActive as boolean | undefined,
    });

    return NextResponse.json(
      {
        message: "Question bank updated successfully.",
        questionBank,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to update CBT question bank:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update question bank.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext,
) {
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

    const bankId = await getBankId(params);

    if (bankId === null) {
      return NextResponse.json(
        { error: "Invalid question bank ID." },
        { status: 400 },
      );
    }

    const questionBank = await deactivateCBTQuestionBank({
      ...context,
      bankId,
    });

    return NextResponse.json(
      {
        message: "Question bank deactivated successfully.",
        questionBank,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to deactivate CBT question bank:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to deactivate question bank.",
      },
      { status: 400 },
    );
  }
}
