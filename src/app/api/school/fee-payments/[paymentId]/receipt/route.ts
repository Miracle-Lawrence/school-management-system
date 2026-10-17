import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/authorization";
import { getFeePaymentReceipt } from "@/lib/services/student-invoice.service";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SCHOOL_OWNER", "SCHOOL_ADMIN"] as const;

type RouteContext = {
  params: Promise<{ paymentId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
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

    const { paymentId: paymentIdParam } = await params;
    const paymentId = Number(paymentIdParam);

    if (!Number.isSafeInteger(paymentId) || paymentId <= 0) {
      return NextResponse.json(
        { error: "Invalid payment ID." },
        { status: 400 },
      );
    }

    const receipt = await getFeePaymentReceipt(schoolId, paymentId);

    return NextResponse.json(
      { receipt },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (
      message.includes("Payment not found") ||
      message.includes("Receipt details could not be found")
    ) {
      return NextResponse.json(
        { error: "Payment receipt not found." },
        { status: 404 },
      );
    }

    if (message.includes("Only confirmed payments")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("GET fee payment receipt error:", error);

    return NextResponse.json(
      { error: "Unable to load payment receipt." },
      { status: 500 },
    );
  }
}
