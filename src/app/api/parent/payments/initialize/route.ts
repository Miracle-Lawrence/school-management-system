
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const initializeSchema = z.object({
  invoiceId: z.number().int().positive(),
});

type PaystackInitializeResponse = {
  status: boolean;
  message?: string;
  data?: {
    authorization_url?: string;
    access_code?: string;
    reference?: string;
  };
};


type PaystackExistingTransactionResponse = {
  status: boolean;
  message?: string;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
  };
};


export async function POST(request: Request) {
  let paymentId: number | null = null;

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

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const appUrl = process.env.APP_URL;

    if (!secretKey || !appUrl) {
      console.error("Paystack configuration is missing.");

      return NextResponse.json(
        { error: "Online payments are not configured." },
        { status: 503 },
      );
    }

    let callbackUrl: string;

    try {
      const baseUrl = new URL(appUrl);

      if (
        baseUrl.protocol !== "https:" &&
        baseUrl.hostname !== "localhost" &&
        baseUrl.hostname !== "127.0.0.1"
      ) {
        return NextResponse.json(
          { error: "The application URL must use HTTPS." },
          { status: 500 },
        );
      }

      callbackUrl = new URL("/parent/payments/callback", baseUrl).toString();
    } catch {
      return NextResponse.json(
        { error: "The application URL is invalid." },
        { status: 500 },
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

    const parsed = initializeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "A valid invoice ID is required." },
        { status: 400 },
      );
    }

    const { invoiceId } = parsed.data;

    const user = await db.orm.public.User.where({
      id: userId,
    }).first();

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Your account is inactive or unavailable." },
        { status: 403 },
      );
    }

    if (user.mustChangePassword) {
      return NextResponse.json(
        { error: "Change your password before making a payment." },
        { status: 403 },
      );
    }

    const parent = await db.orm.public.Parent.where({
      userId,
    }).first();

    if (!parent || parent.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Your parent profile is not linked to this school." },
        { status: 403 },
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "Add an email address to your account before paying." },
        { status: 400 },
      );
    }

    const invoice = await db.orm.public.StudentInvoice.where({
      id: invoiceId,
      schoolId,
    }).first();

    if (!invoice || invoice.status !== "ISSUED") {
      return NextResponse.json(
        { error: "Issued invoice not found." },
        { status: 404 },
      );
    }

    const parentStudent = await db.orm.public.ParentStudent.where({
      parentId: parent.id,
      studentId: invoice.studentId,
    }).first();

    if (!parentStudent) {
      return NextResponse.json(
        { error: "You cannot pay an invoice for an unlinked student." },
        { status: 403 },
      );
    }

    const student = await db.orm.public.Student.where({
      id: invoice.studentId,
      schoolId,
    }).first();

    if (!student) {
      return NextResponse.json(
        { error: "The invoice student could not be verified." },
        { status: 404 },
      );
    }

    // Recover an existing pending payment before creating a new one.
    const existingPendingPayment = await db.orm.public.FeePayment.where({
      invoiceId,
      method: "PAYSTACK",
      status: "PENDING",
    }).first();

    if (existingPendingPayment) {
      let existingVerificationResponse: Response;

      try {
        existingVerificationResponse = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(
            existingPendingPayment.reference,
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${secretKey}`,
              Accept: "application/json",
            },
            cache: "no-store",
            signal: AbortSignal.timeout(15000),
          },
        );
      } catch {
        return NextResponse.json(
          {
            error:
              "An existing payment could not be checked right now. Please check its status before trying again.",
            reference: existingPendingPayment.reference,
          },
          { status: 409 },
        );
      }

      let existingVerification: PaystackExistingTransactionResponse;

      try {
        existingVerification =
          (await existingVerificationResponse.json()) as PaystackExistingTransactionResponse;
      } catch {
        return NextResponse.json(
          {
            error:
              "The existing payment status could not be determined. Please check its status before trying again.",
            reference: existingPendingPayment.reference,
          },
          { status: 409 },
        );
      }

      const existingTransaction = existingVerification.data;

      if (
        existingVerificationResponse.ok &&
        existingVerification.status &&
        existingTransaction?.reference === existingPendingPayment.reference
      ) {
        if (
          existingTransaction.status === "failed" ||
          existingTransaction.status === "abandoned"
        ) {
          // Only release the old attempt when Paystack explicitly
          // reports that it failed or was abandoned.
          await db.orm.public.FeePayment.where({
            id: existingPendingPayment.id,
            reference: existingPendingPayment.reference,
            status: "PENDING",
          }).update({
            status: "FAILED",
          });
        } else {
          // Do not create a second payment while the original
          // transaction is pending or requires confirmation.
          return NextResponse.json(
            {
              error:
                existingTransaction.status === "success"
                  ? "Paystack reports a successful transaction. Check its status before starting another payment."
                  : "A payment is still being processed. Check its status before starting another payment.",
              reference: existingPendingPayment.reference,
              status:
                existingTransaction.status === "success"
                  ? "REQUIRES_VERIFICATION"
                  : "PENDING",
            },
            { status: 409 },
          );
        }
      } else {
        // An unavailable or unrecognized verification result is
        // not proof of failure. Preserve the existing pending record.
        return NextResponse.json(
          {
            error:
              "Paystack could not establish the previous payment's status. Please check it again before starting another payment.",
            reference: existingPendingPayment.reference,
          },
          { status: 409 },
        );
      }
    }

    const reference = `PAY-${randomUUID().toUpperCase()}`;

    const pendingPayment = await db.transaction(async (tx) => {
      const currentInvoice = await tx.orm.public.StudentInvoice.where({
        id: invoiceId,
        schoolId,
      }).first();

      if (!currentInvoice || currentInvoice.status !== "ISSUED") {
        throw new Error("INVOICE_UNAVAILABLE");
      }

      // Follow the locking pattern already used by this project.
      await tx.orm.public.StudentInvoice.where({
        id: invoiceId,
        schoolId,
      }).update({ status: currentInvoice.status });

      const lockedInvoice = await tx.orm.public.StudentInvoice.where({
        id: invoiceId,
        schoolId,
      }).first();

      if (!lockedInvoice || lockedInvoice.status !== "ISSUED") {
        throw new Error("INVOICE_UNAVAILABLE");
      }

      const existingPending = await tx.orm.public.FeePayment.where({
        invoiceId,
        method: "PAYSTACK",
        status: "PENDING",
      }).first();

      if (existingPending) {
        throw new Error("PAYMENT_ALREADY_PENDING");
      }

      const payments = await tx.orm.public.FeePayment.where((item) =>
        item.invoiceId.eq(invoiceId),
      ).all();

      const confirmedKobo = payments.reduce(
        (total, payment) =>
          payment.status === "CONFIRMED"
            ? total + Math.round(Number(payment.amount) * 100)
            : total,
        0,
      );

      const totalKobo = Math.round(Number(lockedInvoice.totalAmount) * 100);

      const outstandingKobo = totalKobo - confirmedKobo;

      if (
        !Number.isSafeInteger(totalKobo) ||
        totalKobo <= 0 ||
        outstandingKobo <= 0
      ) {
        throw new Error("INVOICE_ALREADY_SETTLED");
      }

      const payment = await tx.orm.public.FeePayment.create({
        invoiceId,
        amount: (outstandingKobo / 100).toFixed(2),
        method: "PAYSTACK",
        status: "PENDING",
        reference,
        providerReference: null,
        paidAt: null,
        notes: "Parent portal Paystack payment",
        recordedByUserId: userId,
      });

      return {
        id: payment.id,
        amountKobo: outstandingKobo,
      };
    });

    paymentId = pendingPayment.id;

    let paystackResponse: Response;

    try {
      paystackResponse = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            email: user.email,
            amount: pendingPayment.amountKobo,
            currency: "NGN",
            reference,
            callback_url: callbackUrl,
            metadata: {
              paymentId: pendingPayment.id,
              invoiceId,
              parentId: parent.id,
              schoolId,
            },
          }),
        },
      );
    } catch {
      await db.orm.public.FeePayment.where({
        id: pendingPayment.id,
        reference,
        status: "PENDING",
      }).update({ status: "FAILED" });

      return NextResponse.json(
        { error: "Unable to connect to the payment provider." },
        { status: 502 },
      );
    }

    let result: PaystackInitializeResponse;

    try {
      result = (await paystackResponse.json()) as PaystackInitializeResponse;
    } catch {
      result = { status: false };
    }

    const authorizationUrl = result.data?.authorization_url;
    const providerReference = result.data?.reference;

    if (
      !paystackResponse.ok ||
      !result.status ||
      !authorizationUrl ||
      !providerReference ||
      providerReference !== reference
    ) {
      await db.orm.public.FeePayment.where({
        id: pendingPayment.id,
        reference,
        status: "PENDING",
      }).update({ status: "FAILED" });

      console.error("Paystack initialization failed.", {
        httpStatus: paystackResponse.status,
        providerMessage: result.message,
      });

      return NextResponse.json(
        { error: "Unable to initialize your payment. Please try again." },
        { status: 502 },
      );
    }

    await db.orm.public.FeePayment.where({
      id: pendingPayment.id,
      reference,
      status: "PENDING",
    }).update({ providerReference });

    return NextResponse.json(
      {
        authorizationUrl,
        reference,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "PAYMENT_ALREADY_PENDING") {
      return NextResponse.json(
        {
          error:
            "A payment is already pending for this invoice. Check its status before starting another payment.",
        },
        { status: 409 },
      );
    }

    if (
      message === "INVOICE_UNAVAILABLE" ||
      message === "INVOICE_ALREADY_SETTLED"
    ) {
      return NextResponse.json(
        { error: "This invoice is no longer available for payment." },
        { status: 409 },
      );
    }

    console.error("Paystack initialization route error:", error);

    return NextResponse.json(
      { error: "Unable to initialize your payment." },
      { status: 500 },
    );
  }
}
