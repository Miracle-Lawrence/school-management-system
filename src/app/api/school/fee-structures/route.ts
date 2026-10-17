import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/authorization";
import {
  createFeeStructure,
  getFeeStructures,
} from "@/lib/services/fee-structure.service";
import { createFeeStructureSchema } from "@/lib/validation/fee-structure";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SCHOOL_OWNER", "SCHOOL_ADMIN"] as const;

export async function GET() {
  try {
    const session = await requireApiRole([...ALLOWED_ROLES]);

    if (session instanceof NextResponse) {
      return session;
    }

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { error: "School context is required." },
        { status: 400 },
      );
    }

    const structures = await getFeeStructures(schoolId);

    return NextResponse.json(
      { structures },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("GET fee structures error:", error);

    return NextResponse.json(
      { error: "Unable to load fee structures." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiRole([...ALLOWED_ROLES]);

    if (session instanceof NextResponse) {
      return session;
    }

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { error: "School context is required." },
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

    const parsed = createFeeStructureSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please check the fee structure details.",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const structure = await createFeeStructure({
      ...parsed.data,
      schoolId,
    });

    return NextResponse.json({ structure }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create fee structure.";

    if (
      message.includes("already exists") ||
      message.includes("already exists for this category")
    ) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    if (
      message.startsWith("Select an active fee category") ||
      message.startsWith("Select a class") ||
      message.startsWith("Select an academic session") ||
      message.startsWith("Select a term") ||
      message.startsWith("The fee amount")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("POST fee structure error:", error);

    return NextResponse.json(
      { error: "Unable to create fee structure." },
      { status: 500 },
    );
  }
}
