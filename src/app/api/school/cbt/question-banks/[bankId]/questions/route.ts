import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import {
  createCBTQuestion,
  getCBTQuestions,
} from "@/lib/services/cbt-question.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ bankId: string }>;
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

  return {
    userId,
    schoolId,
    role: session.user.role,
  };
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

    if (session instanceof NextResponse) return session;

    const context = getUserContext(session);

    if (!context) {
      return NextResponse.json(
        { error: "Valid user and school context are required." },
        { status: 400 },
      );
    }

    const { bankId: bankIdParam } = await params;
    const bankId = parsePositiveId(bankIdParam);

    if (bankId === null) {
      return NextResponse.json(
        { error: "Invalid question bank ID." },
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

    const questions = await getCBTQuestions({
      ...context,
      bankId,
      includeInactive: inactiveParam === "true",
    });

    return NextResponse.json(
      { questions },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load CBT questions:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load questions.",
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

    const { bankId: bankIdParam } = await params;
    const bankId = parsePositiveId(bankIdParam);

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

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Invalid question request." },
        { status: 400 },
      );
    }

    const allowedTypes = [
      "MULTIPLE_CHOICE",
      "TRUE_FALSE",
      "THEORY",
    ];

    const allowedDifficulties = [
      "EASY",
      "MEDIUM",
      "HARD",
    ];

    if (
      typeof body.type !== "string" ||
      !allowedTypes.includes(body.type)
    ) {
      return NextResponse.json(
        { error: "Invalid question type." },
        { status: 400 },
      );
    }

    if (typeof body.prompt !== "string" || !body.prompt.trim()) {
      return NextResponse.json(
        { error: "Question prompt is required." },
        { status: 400 },
      );
    }

    if (
      typeof body.marks !== "number" ||
      !Number.isFinite(body.marks) ||
      body.marks <= 0
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
        !allowedDifficulties.includes(body.difficulty)
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
        { error: "Question explanation must be text." },
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

    const question = await createCBTQuestion({
      ...context,
      bankId,
      type: body.type as
        | "MULTIPLE_CHOICE"
        | "TRUE_FALSE"
        | "THEORY",
      prompt: body.prompt,
      marks: body.marks,
      difficulty: body.difficulty as
        | "EASY"
        | "MEDIUM"
        | "HARD"
        | undefined,
      explanation: body.explanation as string | undefined,
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
        message: "Question created successfully.",
        question,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to create CBT question:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create question.",
      },
      { status: 400 },
    );
  }
}
