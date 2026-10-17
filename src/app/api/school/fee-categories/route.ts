import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import {
  createFeeCategory,
  getFeeCategories,
} from "@/lib/services/fee-category.service";
import { createFeeCategorySchema } from "@/lib/validation/fee-category";

export async function GET() {
  try {
    const session = await requireApiRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

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

    const categories = await getFeeCategories(schoolId);

    return NextResponse.json(
      { categories },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Fee category lookup error:", error);

    return NextResponse.json(
      { error: "Unable to load fee categories." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
const session = await requireApiRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

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

    const body = await request.json();
    const validation = createFeeCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Please correct the fee category details.",
          issues: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const category = await createFeeCategory({
      schoolId,
      name: validation.data.name,
      description: validation.data.description || undefined,
    });

    return NextResponse.json(
      {
        message: "Fee category created successfully.",
        category,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Fee category creation error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create fee category.";

    const isDuplicate = message.includes("already exists");

    return NextResponse.json(
      { error: message },
      { status: isDuplicate ? 409 : 400 },
    );
  }
}
