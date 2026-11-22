import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import {
  deactivateCBTQuestion,
  getCBTQuestionById,
  updateCBTQuestion,
} from "@/lib/services/cbt-question.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ questionId: string }>;
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

function validateOptions(value: unknown): boolean {
  if (!Array.isArray(value)) return false;

  return value.every(
    (option) =>
      isRecord(option) &&
      typeof option.text === "string" &&
      typeof option.isCorrect === "boolean" &&
      (
        option.displayOrder === undefined ||
        (
          typeof option.displayOrder === "number" &&
          Number.isSafeInteger(option.displayOrder)
        )
      ),
  );
}

const allowedTypes = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "THEORY",
] as const;

const allowedDifficulties = [
  "EASY",
  "MEDIUM",
  "HARD",
] as const;

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

    const { questionId: questionIdParam } = await params;
    const questionId = parsePositiveId(questionIdParam);

    if (questionId === null) {
      return NextResponse.json(
        { error: "Invalid question ID." },
        { status: 400 },
      );
    }

    const question = await getCBTQuestionById({
      ...context,
      questionId,
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { question },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Failed to load CBT question:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load question.",
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

    const { questionId: questionIdParam } = await params;
    const questionId = parsePositiveId(questionIdParam);

    if (questionId === null) {
      return NextResponse.json(
        { error: "Invalid question ID." },
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
        { error: "Invalid question update request." },
        { status: 400 },
      );
    }

    const allowedFields = [
      "prompt",
      "type",
      "marks",
      "difficulty",
      "explanation",
      "allowMultipleAnswers",
      "options",
    ];

    if (
      Object.keys(body).length === 0 ||
      Object.keys(body).some((key) => !allowedFields.includes(key))
    ) {
      return NextResponse.json(
        { error: "Provide valid question fields to update." },
        { status: 400 },
      );
    }

    if (
      body.prompt !== undefined &&
      (
        typeof body.prompt !== "string" ||
        !body.prompt.trim()
      )
    ) {
      return NextResponse.json(
        { error: "Question prompt must be non-empty text." },
        { status: 400 },
      );
    }

    if (
      body.type !== undefined &&
      (
        typeof body.type !== "string" ||
        !allowedTypes.includes(
          body.type as (typeof allowedTypes)[number],
        )
      )
    ) {
      return NextResponse.json(
        { error: "Invalid question type." },
        { status: 400 },
      );
    }

    if (
      body.marks !== undefined &&
      (
        typeof body.marks !== "number" ||
        !Number.isFinite(body.marks) ||
        body.marks <= 0
      )
    ) {
      return NextResponse.json(
        { error: "Question marks must be a positive number." },
        { status: 400 },
      );
    }

    if (
      body.difficulty !== undefined &&
      (
        typeof body.difficulty !== "string" ||
        !allowedDifficulties.includes(
          body.difficulty as (typeof allowedDifficulties)[number],
        )
      )
    ) {
      return NextResponse.json(
        { error: "Invalid question difficulty." },
        { status: 400 },
      );
    }

    if (
      body.explanation !== undefined &&
      body.explanation !== null &&
      typeof body.explanation !== "string"
    ) {
      return NextResponse.json(
        { error: "Question explanation must be text or null." },
        { status: 400 },
      );
    }

    if (
      body.allowMultipleAnswers !== undefined &&
      typeof body.allowMultipleAnswers !== "boolean"
    ) {
      return NextResponse.json(
        { error: "allowMultipleAnswers must be a boolean." },
        { status: 400 },
      );
    }

    if (
      body.options !== undefined &&
      !validateOptions(body.options)
    ) {
      return NextResponse.json(
        { error: "Invalid question options." },
        { status: 400 },
      );
    }

    const question = await updateCBTQuestion({
      ...context,
      questionId,
      prompt: body.prompt as string | undefined,
      type: body.type as
        | "MULTIPLE_CHOICE"
        | "TRUE_FALSE"
        | "THEORY"
        | undefined,
      marks: body.marks as number | undefined,
      difficulty: body.difficulty as
        | "EASY"
        | "MEDIUM"
        | "HARD"
        | undefined,
      explanation: body.explanation as string | null | undefined,
      allowMultipleAnswers: body.allowMultipleAnswers as
        | boolean
        | undefined,
      options: body.options as
        | {
            text: string;
            isCorrect: boolean;
            displayOrder?: number;
          }[]
        | undefined,
    });

    return NextResponse.json(
      {
        message: "Question updated successfully.",
        question,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Failed to update CBT question:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update question.",
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

    const { questionId: questionIdParam } = await params;
    const questionId = parsePositiveId(questionIdParam);

    if (questionId === null) {
      return NextResponse.json(
        { error: "Invalid question ID." },
        { status: 400 },
      );
    }

    await deactivateCBTQuestion({
      ...context,
      questionId,
    });

    return NextResponse.json(
      { message: "Question deactivated successfully." },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Failed to deactivate CBT question:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to deactivate question.",
      },
      { status: 400 },
    );
  }
}
