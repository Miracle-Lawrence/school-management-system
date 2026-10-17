import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/authorization";
import {
  getFeeStructureOptions,
  getTermsForSession,
} from "@/lib/services/fee-structure.service";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SCHOOL_OWNER", "SCHOOL_ADMIN"] as const;

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const sessionIdParam = searchParams.get("sessionId");

    const options = await getFeeStructureOptions(schoolId);

    let terms: Awaited<ReturnType<typeof getTermsForSession>> = [];

    if (sessionIdParam !== null) {
      const sessionId = Number(sessionIdParam);

      if (!Number.isSafeInteger(sessionId) || sessionId <= 0) {
        return NextResponse.json(
          { error: "A valid academic session ID is required." },
          { status: 400 },
        );
      }

      terms = await getTermsForSession(schoolId, sessionId);
    }

    return NextResponse.json(
      { ...options, terms },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid academic session."
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("GET fee structure options error:", error);

    return NextResponse.json(
      { error: "Unable to load fee structure options." },
      { status: 500 },
    );
  }
}
