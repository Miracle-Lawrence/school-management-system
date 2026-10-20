import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PaystackWebhookPayload = {
  event?: string;
  data?: {
    id?: number;
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message?: string;
  data?: {
    id?: number;
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
  };
};

function verifySignature(
  rawBody: string,
  signature: string,
  secretKey: string,
): boolean {
  // SHA-512 produces a 128-character hexadecimal signature.
  if (!/^[a-fA-F0-9]{128}$/.test(signature)) {
    return false;
  }

  const expectedSignature = createHmac("sha512", secretKey)
    .update(rawBody, "utf8")
    .digest();

  const receivedSignature = Buffer.from(signature, "hex");

  return (
    receivedSignature.length === expectedSignature.length &&
    timingSafeEqual(receivedSignature, expectedSignature)
  );
}

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error("Paystack webhook: secret key is not configured.");

    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 500 },
    );
  }

  let rawBody: string;

  try {
    // Read the original request body before parsing JSON.
    // Paystack's signature must be checked against these exact bytes.
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Unable to read webhook payload." },
      { status: 400 },
    );
  }

  const signature = request.headers.get("x-paystack-signature");

  if (!signature || !verifySignature(rawBody, signature, secretKey)) {
    console.warn("Paystack webhook rejected: invalid signature.");

    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 401 },
    );
  }

  let payload: PaystackWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as PaystackWebhookPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  // We only process successful customer payment events.
  // Other valid Paystack events can be acknowledged without action.
  if (payload.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const eventData = payload.data;
  const reference = eventData?.reference;

  if (!reference || typeof reference !== "string") {
    console.error("Paystack charge.success event has no reference.");

    return NextResponse.json(
      { error: "Transaction reference is missing." },
      { status: 400 },
    );
  }

  try {
    // Find the existing payment created by our initialization endpoint.
    const payment = await db.orm.public.FeePayment.where({
      reference,
      method: "PAYSTACK",
    }).first();

    if (!payment) {
      // Ask Paystack to retry later if our local payment is not found.
      console.error("Paystack webhook: local payment not found.", {
        reference,
      });

      return NextResponse.json(
        { error: "Payment record not found yet." },
        { status: 500 },
      );
    }

    // Repeated notifications must not confirm the payment twice.
    if (payment.status === "CONFIRMED") {
      return NextResponse.json({
        received: true,
        status: "already_confirmed",
      });
    }

    if (payment.status !== "PENDING") {
      console.warn(
        "Paystack success event received for a non-pending payment.",
        {
          paymentId: payment.id,
          status: payment.status,
        },
      );

      // Do not silently change a FAILED or REFUNDED record.
      return NextResponse.json({
        received: true,
        status: "requires_reconciliation",
      });
    }

    // Independently verify the transaction using Paystack's API.
    let providerResponse: Response;

    try {
      providerResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
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
      console.error("Paystack webhook: verification request failed.", {
        reference,
      });

      return NextResponse.json(
        { error: "Transaction verification temporarily unavailable." },
        { status: 502 },
      );
    }

    let verification: PaystackVerifyResponse;

    try {
      verification = (await providerResponse.json()) as PaystackVerifyResponse;
    } catch {
      return NextResponse.json(
        { error: "Unable to read Paystack verification response." },
        { status: 502 },
      );
    }

    if (!providerResponse.ok || !verification.status || !verification.data) {
      console.error("Paystack webhook: transaction verification failed.", {
        reference,
        httpStatus: providerResponse.status,
      });

      return NextResponse.json(
        { error: "Transaction could not be verified yet." },
        { status: 502 },
      );
    }

    const transaction = verification.data;
    const expectedAmountKobo = Math.round(Number(payment.amount) * 100);

    // Never trust the webhook payload alone to confirm a payment.
    if (
      transaction.reference !== reference ||
      transaction.status !== "success" ||
      transaction.currency !== "NGN" ||
      !Number.isSafeInteger(transaction.amount) ||
      transaction.amount !== expectedAmountKobo ||
      !Number.isSafeInteger(expectedAmountKobo) ||
      expectedAmountKobo <= 0
    ) {
      console.error("Paystack webhook: transaction details mismatch.", {
        paymentId: payment.id,
        reference,
        providerReference: transaction.reference,
        providerStatus: transaction.status,
        providerCurrency: transaction.currency,
      });

      // A mismatch needs investigation; do not confirm the payment.
      return NextResponse.json({
        received: true,
        status: "requires_reconciliation",
      });
    }

    await db.transaction(async (tx) => {
      const currentPayment = await tx.orm.public.FeePayment.where({
        id: payment.id,
        reference,
      }).first();

      if (!currentPayment) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      // Idempotency: callback and webhook may arrive at the same time.
      if (currentPayment.status === "CONFIRMED") {
        return;
      }

      if (currentPayment.status !== "PENDING") {
        throw new Error("PAYMENT_NOT_PENDING");
      }

      const currentInvoice = await tx.orm.public.StudentInvoice.where({
        id: currentPayment.invoiceId,
      }).first();

      if (!currentInvoice || currentInvoice.status !== "ISSUED") {
        throw new Error("INVOICE_UNAVAILABLE");
      }

      // Preserve the invoice-update pattern currently used by this project.
      await tx.orm.public.StudentInvoice.where({
        id: currentInvoice.id,
        schoolId: currentInvoice.schoolId,
      }).update({
        status: currentInvoice.status,
      });

      const invoice = await tx.orm.public.StudentInvoice.where({
        id: currentInvoice.id,
        schoolId: currentInvoice.schoolId,
      }).first();

      if (!invoice || invoice.status !== "ISSUED") {
        throw new Error("INVOICE_UNAVAILABLE");
      }

      const invoicePayments = await tx.orm.public.FeePayment.where((item) =>
        item.invoiceId.eq(invoice.id),
      ).all();

      const confirmedKobo = invoicePayments.reduce(
        (total, item) =>
          item.status === "CONFIRMED"
            ? total + Math.round(Number(item.amount) * 100)
            : total,
        0,
      );

      const invoiceTotalKobo = Math.round(Number(invoice.totalAmount) * 100);

      const paymentAmountKobo = Math.round(Number(currentPayment.amount) * 100);

      const outstandingKobo = invoiceTotalKobo - confirmedKobo;

      if (
        !Number.isSafeInteger(invoiceTotalKobo) ||
        !Number.isSafeInteger(paymentAmountKobo) ||
        paymentAmountKobo <= 0 ||
        paymentAmountKobo > outstandingKobo
      ) {
        throw new Error("OUTSTANDING_BALANCE_CHANGED");
      }

      await tx.orm.public.FeePayment.where({
        id: currentPayment.id,
        reference,
        status: "PENDING",
      }).update({
        status: "CONFIRMED",
        paidAt: new Date().toISOString(),
        providerReference:
          transaction.id !== undefined ? String(transaction.id) : reference,
      });
    });

    console.info("Paystack payment confirmed by webhook.", {
      reference,
      paymentId: payment.id,
    });

    return NextResponse.json({
      received: true,
      status: "confirmed",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    console.error("Paystack webhook processing error.", {
      reference,
      message,
    });

    // Return a non-2xx response so Paystack can retry transient failures.
    return NextResponse.json(
      { error: "Webhook processing could not be completed." },
      { status: 500 },
    );
  }
}
