import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiRole } from "@/lib/auth/authorization";
import { getPaystackSecretCandidates } from "@/lib/payments/school-paystack";
import { confirmPaystackPayment } from "@/lib/payments/confirm-paystack-payment";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const verifySchema = z.object({
  reference: z.string().trim().min(10).max(100),
});

type PaystackVerifyResponse = {
  status: boolean;
  message?: string;
  data?: {
    id?: number;
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    gateway_response?: string;
  };
};

export async function POST(request: Request) {
  try {
    const session = await requireApiRole(["PARENT"]);

    if (session instanceof NextResponse) {
      return session;
    }

    const userId = Number(session.user.id);
    const schoolId = session.user.schoolId;

    if (!Number.isSafeInteger(userId) || userId <= 0 || !schoolId) {
      return NextResponse.json(
        { error: "Valid parent and school context are required." },
        { status: 400 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "A valid JSON request is required." },
        { status: 400 },
      );
    }

    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "A valid transaction reference is required." },
        { status: 400 },
      );
    }

    const { reference } = parsed.data;

    const user = await db.orm.public.User.where({
      id: userId,
    }).first();

    if (!user || !user.isActive || user.mustChangePassword) {
      return NextResponse.json(
        { error: "Your account cannot verify this payment." },
        { status: 403 },
      );
    }

    const parent = await db.orm.public.Parent.where({
      userId,
    }).first();

    if (!parent || parent.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Parent profile not found." },
        { status: 403 },
      );
    }

    const payment = await db.orm.public.FeePayment.where({
      reference,
      method: "PAYSTACK",
    }).first();

    if (!payment) {
      return NextResponse.json(
        { error: "Payment reference not found." },
        { status: 404 },
      );
    }

    const invoice = await db.orm.public.StudentInvoice.where({
      id: payment.invoiceId,
      schoolId,
    }).first();

    if (!invoice) {
      return NextResponse.json(
        { error: "Payment invoice not found." },
        { status: 404 },
      );
    }

    const parentStudent = await db.orm.public.ParentStudent.where({
      parentId: parent.id,
      studentId: invoice.studentId,
    }).first();

    if (!parentStudent) {
      return NextResponse.json(
        { error: "You cannot verify a payment for an unlinked student." },
        { status: 403 },
      );
    }

    // Repeated verification must not create another payment.
    if (payment.status === "CONFIRMED") {
      return NextResponse.json(
        {
          status: "CONFIRMED",
          reference,
          message: "This payment has already been confirmed.",
        },
        {
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: "This payment is no longer pending verification." },
        { status: 409 },
      );
    }

    const secretCandidates =
      await getPaystackSecretCandidates(schoolId);

    let providerResponse: Response | null = null;
    let result: PaystackVerifyResponse | null = null;

    // Try the school's configured key and, when available,
    // the legacy key for transactions created before migration.
    for (const candidateSecret of secretCandidates) {
      let candidateResponse: Response;

      try {
        candidateResponse = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${candidateSecret}`,
              Accept: "application/json",
            },
            cache: "no-store",
            signal: AbortSignal.timeout(15000),
          },
        );
      } catch {
        continue;
      }

      let candidateResult: PaystackVerifyResponse;

      try {
        candidateResult =
          (await candidateResponse.json()) as PaystackVerifyResponse;
      } catch {
        continue;
      }

      // A candidate is accepted only when Paystack confirms the
      // exact reference requested by this authenticated parent.
      if (
        candidateResponse.ok &&
        candidateResult.status &&
        candidateResult.data?.reference === reference
      ) {
        providerResponse = candidateResponse;
        result = candidateResult;
        break;
      }
    }

    if (
      !providerResponse ||
      !result ||
      !providerResponse.ok ||
      !result.status ||
      !result.data
    ) {
      console.error("Paystack verification could not be established.", {
        paymentId: payment.id,
        reference,
        httpStatus: providerResponse?.status,
      });

      return NextResponse.json(
        {
          status: "PENDING",
          message: "The transaction could not be verified yet. Please retry.",
        },
        { status: 502 },
      );
    }

    const transaction = result.data;

    // Never trust the browser's payment status or amount.
    if (
      transaction.reference !== reference ||
      transaction.currency !== "NGN" ||
      !Number.isSafeInteger(transaction.amount) ||
      transaction.amount !== Math.round(Number(payment.amount) * 100)
    ) {
      console.error("Paystack transaction details did not match.", {
        paymentId: payment.id,
        reference,
        providerReference: transaction.reference,
        currency: transaction.currency,
      });

      return NextResponse.json(
        {
          error:
            "The transaction details could not be matched. Contact your school administrator.",
        },
        { status: 409 },
      );
    }

    if (transaction.status === "failed" || transaction.status === "abandoned") {
      await db.orm.public.FeePayment.where({
        id: payment.id,
        reference,
        status: "PENDING",
      }).update({
        status: "FAILED",
      });

      return NextResponse.json(
        {
          status: "FAILED",
          message: "The payment was not completed successfully.",
        },
        { status: 400 },
      );
    }

    if (transaction.status !== "success") {
      return NextResponse.json(
        {
          status: "PENDING",
          message: "The transaction has not completed successfully yet.",
        },
        { status: 202 },
      );
    }

    const confirmed = await confirmPaystackPayment({
      paymentId: payment.id,
      reference,
      schoolId,
      providerReference:
        transaction.id !== undefined ? String(transaction.id) : reference,
    });

    if (!confirmed) {
      throw new Error("PAYMENT_CONFIRMATION_FAILED");
    }

    return NextResponse.json(
      {
        status: "CONFIRMED",
        reference,
        message: "Payment verified and confirmed successfully.",
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "PAYMENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Payment not found." },
        { status: 404 },
      );
    }

    if (message === "PAYMENT_NOT_PENDING") {
      return NextResponse.json(
        { error: "This payment is no longer pending." },
        { status: 409 },
      );
    }

    if (message === "INVOICE_UNAVAILABLE") {
      return NextResponse.json(
        {
          error:
            "The invoice is no longer available. Contact your school administrator to reconcile the payment.",
        },
        { status: 409 },
      );
    }

    if (message === "OUTSTANDING_BALANCE_CHANGED") {
      return NextResponse.json(
        {
          error:
            "The invoice balance changed while payment was processing. Contact your school administrator to reconcile the transaction.",
        },
        { status: 409 },
      );
    }

    console.error("Paystack verification route error:", error);

    return NextResponse.json(
      { error: "Unable to verify the payment." },
      { status: 500 },
    );
  }
}


