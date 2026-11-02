import { db } from "@/prisma/db";

type ConfirmPaystackPaymentInput = {
  paymentId: number;
  reference: string;
  schoolId: number;
  providerReference: string;
};

export async function confirmPaystackPayment({
  paymentId,
  reference,
  schoolId,
  providerReference,
}: ConfirmPaystackPaymentInput): Promise<boolean> {
  return db.transaction(async (tx) => {
    // Find the payment and obtain the invoice ID.
    const currentPayment = await tx.orm.public.FeePayment.where({
      id: paymentId,
      reference,
    }).first();

    if (!currentPayment) {
      throw new Error("PAYMENT_NOT_FOUND");
    }

    // Idempotency: an earlier request may already have confirmed it.
    if (currentPayment.status === "CONFIRMED") {
      return true;
    }

    if (currentPayment.status !== "PENDING") {
      throw new Error("PAYMENT_NOT_PENDING");
    }

    // Acquire a genuine PostgreSQL row-level lock on the invoice.
    const lockPlan = db.raw.sql`
      SELECT "id"
      FROM "StudentInvoice"
      WHERE "id" = ${currentPayment.invoiceId}
        AND "schoolId" = ${schoolId}
      FOR UPDATE
    `.returnsRow({
      id: "pg/int4@1",
    }).build();

    let invoiceLocked = false;

    for await (const row of tx.query(lockPlan)) {
      invoiceLocked = true;
      break;
    }

    if (!invoiceLocked) {
      throw new Error("INVOICE_UNAVAILABLE");
    }

    // Read the invoice after acquiring its lock.
    const invoice = await tx.orm.public.StudentInvoice.where({
      id: currentPayment.invoiceId,
      schoolId,
    }).first();

    if (!invoice || invoice.status !== "ISSUED") {
      throw new Error("INVOICE_UNAVAILABLE");
    }

    // Re-read payment state after acquiring the invoice lock.
    const paymentAfterLock = await tx.orm.public.FeePayment.where({
      id: paymentId,
      reference,
    }).first();

    if (!paymentAfterLock) {
      throw new Error("PAYMENT_NOT_FOUND");
    }

    if (paymentAfterLock.status === "CONFIRMED") {
      return true;
    }

    if (paymentAfterLock.status !== "PENDING") {
      throw new Error("PAYMENT_NOT_PENDING");
    }

    // Calculate the invoice balance using confirmed payments only.
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
    const paymentAmountKobo = Math.round(
      Number(paymentAfterLock.amount) * 100,
    );

    const outstandingKobo = invoiceTotalKobo - confirmedKobo;

    if (
      !Number.isSafeInteger(confirmedKobo) ||
      !Number.isSafeInteger(invoiceTotalKobo) ||
      !Number.isSafeInteger(paymentAmountKobo) ||
      paymentAmountKobo <= 0 ||
      paymentAmountKobo > outstandingKobo
    ) {
      throw new Error("OUTSTANDING_BALANCE_CHANGED");
    }

    // Conditional update prevents a second confirmation.
    await tx.orm.public.FeePayment.where({
      id: paymentAfterLock.id,
      reference,
      status: "PENDING",
    }).update({
      status: "CONFIRMED",
      paidAt: new Date().toISOString(),
      providerReference,
    });

    // Verify the final persisted state.
    const confirmedPayment = await tx.orm.public.FeePayment.where({
      id: paymentAfterLock.id,
      reference,
    }).first();

    if (!confirmedPayment || confirmedPayment.status !== "CONFIRMED") {
      throw new Error("PAYMENT_CONFIRMATION_FAILED");
    }

    return true;
  });
}
