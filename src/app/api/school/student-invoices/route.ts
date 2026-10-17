import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/authorization";
import {
  createFeePayment,
  createTermInvoice,
  getStudentInvoiceOptions,
  getStudentInvoices,
} from "@/lib/services/student-invoice.service";
import {
  createFeePaymentSchema,
  createTermInvoiceSchema,
} from "@/lib/validation/student-invoice";

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

    const [options, invoices] = await Promise.all([
      getStudentInvoiceOptions(schoolId),
      getStudentInvoices(schoolId),
    ]);

    return NextResponse.json(
      { ...options, invoices },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET student invoices error:", error);

    return NextResponse.json(
      { error: "Unable to load student invoices." },
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

    const parsed = createTermInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please check the invoice details.",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const invoice = await createTermInvoice({
      ...parsed.data,
      schoolId,
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create student invoice.";

    if (message.includes("already exists")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    if (
      message.startsWith("Select an active student") ||
      message.startsWith("The selected student") ||
      message.startsWith("Select an academic session") ||
      message.startsWith("Select a term") ||
      message.startsWith("No active fee structures") ||
      message.startsWith("The amount for") ||
      message.startsWith("A fee category")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("POST student invoice error:", error);

    return NextResponse.json(
      { error: "Unable to create student invoice." },
      { status: 500 },
    );
  }
}



export async function PUT(request: Request) {
  try {
    const session = await requireApiRole([...ALLOWED_ROLES]);

    if (session instanceof NextResponse) {
      return session;
    }

    const schoolId = session.user.schoolId;
    const userId = Number(session.user.id);

    if (!schoolId || !Number.isSafeInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { error: "Valid school and user context are required." },
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

    const parsed = createFeePaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please check the payment details.",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const payment = await createFeePayment({
      ...parsed.data,
      schoolId,
      recordedByUserId: userId,
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to record payment.";

    if (
      message.includes("Invoice not found") ||
      message.includes("issued invoices") ||
      message.includes("outstanding balance") ||
      message.includes("paid in full") ||
      message.includes("valid payment amount") ||
      message.includes("no longer available")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("PUT student invoice payment error:", error);

    return NextResponse.json(
      { error: "Unable to record payment." },
      { status: 500 },
    );
  }
}
