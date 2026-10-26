import { db } from "@/prisma/db";
import { sendEmail } from "@/lib/services/email.service";

export type SendTrackedEmailInput = {
  schoolId: number;
  userId?: number | null;
  notificationId?: number | null;
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type SendTrackedEmailResult = {
  deliveryId: number;
  status: "SENT" | "FAILED";
  providerMessageId: string | null;
  nextRetryAt: string | null;
};

const INITIAL_RETRY_DELAY_MS = 5 * 60 * 1000;

export async function sendTrackedEmail(
  input: SendTrackedEmailInput,
): Promise<SendTrackedEmailResult> {
  const recipientEmail = input.to.trim();

  if (!recipientEmail) {
    throw new Error("A recipient email address is required.");
  }

  const delivery = await db.orm.public.EmailDelivery.create({
    schoolId: input.schoolId,
    userId: input.userId ?? null,
    notificationId: input.notificationId ?? null,
    recipientEmail,
    subject: input.subject.trim(),
    textBody: input.text,
    htmlBody: input.html ?? null,
    status: "PENDING",
    attemptCount: 0,
    providerMessageId: null,
    lastError: null,
    nextRetryAt: null,
    sentAt: null,
    deliveredAt: null,
  });

  let providerMessageId: string;

  try {
    const result = await sendEmail({
      to: recipientEmail,
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });

    providerMessageId = result.id;
  } catch (error) {
    const nextRetryAt = new Date(
      Date.now() + INITIAL_RETRY_DELAY_MS,
    ).toISOString();

    const lastError =
      error instanceof Error
        ? error.message.slice(0, 2000)
        : "Email delivery failed.";

    await db.orm.public.EmailDelivery.where({
      id: delivery.id,
      schoolId: input.schoolId,
    }).update({
      status: "FAILED",
      attemptCount: 1,
      lastError,
      nextRetryAt,
    });

    return {
      deliveryId: delivery.id,
      status: "FAILED",
      providerMessageId: null,
      nextRetryAt,
    };
  }

  await db.orm.public.EmailDelivery.where({
    id: delivery.id,
    schoolId: input.schoolId,
  }).update({
    status: "SENT",
    attemptCount: 1,
    providerMessageId,
    sentAt: new Date().toISOString(),
    lastError: null,
    nextRetryAt: null,
  });

  return {
    deliveryId: delivery.id,
    status: "SENT",
    providerMessageId,
    nextRetryAt: null,
  };
}

const MAX_EMAIL_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [
  5 * 60 * 1000,
  15 * 60 * 1000,
];

export type EmailRetrySummary = {
  checkedCount: number;
  retriedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
};

export async function processDueEmailRetries(): Promise<EmailRetrySummary> {
  const now = Date.now();

  const failedDeliveries = await db.orm.public.EmailDelivery.where({
    status: "FAILED",
  }).all();

  const dueDeliveries = failedDeliveries
    .filter(
      (delivery) =>
        delivery.attemptCount < MAX_EMAIL_ATTEMPTS &&
        delivery.nextRetryAt !== null &&
        new Date(delivery.nextRetryAt).getTime() <= now,
    )
    .slice(0, 20);

  const summary: EmailRetrySummary = {
    checkedCount: dueDeliveries.length,
    retriedCount: 0,
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0,
  };

  for (const delivery of dueDeliveries) {
    try {
      const current = await db.orm.public.EmailDelivery.where({
        id: delivery.id,
        schoolId: delivery.schoolId,
      }).first();

      if (
        !current ||
        current.status !== "FAILED" ||
        current.attemptCount >= MAX_EMAIL_ATTEMPTS ||
        !current.nextRetryAt ||
        new Date(current.nextRetryAt).getTime() > Date.now()
      ) {
        summary.skippedCount += 1;
        continue;
      }

      summary.retriedCount += 1;

      try {
        const result = await sendEmail({
          to: current.recipientEmail,
          subject: current.subject,
          text: current.textBody ?? "",
          ...(current.htmlBody ? { html: current.htmlBody } : {}),
        });

        await db.orm.public.EmailDelivery.where({
          id: current.id,
          schoolId: current.schoolId,
        }).update({
          status: "SENT",
          attemptCount: current.attemptCount + 1,
          providerMessageId: result.id,
          sentAt: new Date().toISOString(),
          lastError: null,
          nextRetryAt: null,
        });

        summary.sentCount += 1;
      } catch (error) {
        const attemptCount = current.attemptCount + 1;
        const canRetry = attemptCount < MAX_EMAIL_ATTEMPTS;

        const nextRetryAt = canRetry
          ? new Date(
              Date.now() +
                RETRY_DELAYS_MS[
                  Math.min(attemptCount - 1, RETRY_DELAYS_MS.length - 1)
                ],
            ).toISOString()
          : null;

        const lastError =
          error instanceof Error
            ? error.message.slice(0, 2000)
            : "Email retry failed.";

        await db.orm.public.EmailDelivery.where({
          id: current.id,
          schoolId: current.schoolId,
        }).update({
          status: "FAILED",
          attemptCount,
          lastError,
          nextRetryAt,
        });

        summary.failedCount += 1;

        console.error("Email retry failed.", {
          deliveryId: current.id,
          attemptCount,
          canRetry,
        });
      }
    } catch (error) {
      summary.failedCount += 1;

      console.error("Unable to process email delivery retry.", {
        deliveryId: delivery.id,
        error,
      });
    }
  }

  return summary;
}
