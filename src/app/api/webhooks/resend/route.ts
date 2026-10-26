import { NextResponse } from "next/server";
import { Resend } from "resend";

import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";

type ResendEmailEvent = {
  type?: string;
  data?: {
    email_id?: string;
  };
};

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Email webhook processing is not configured." },
      { status: 503 },
    );
  }

  const payload = await request.text();

  let event: ResendEmailEvent;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY ?? "");

    event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret,
    }) as ResendEmailEvent;
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 },
    );
  }

  const eventType = event.type;
  const providerMessageId = event.data?.email_id;

  if (
    eventType !== "email.delivered" &&
    eventType !== "email.bounced"
  ) {
    return NextResponse.json({ received: true });
  }

  if (
    typeof providerMessageId !== "string" ||
    !providerMessageId.trim()
  ) {
    return NextResponse.json(
      { error: "The email event is missing its message ID." },
      { status: 400 },
    );
  }

  try {
    const delivery = await db.orm.public.EmailDelivery.where({
      providerMessageId,
    }).first();

    if (!delivery) {
      console.warn("Resend event received for an untracked email.", {
        eventType,
      });

      return NextResponse.json({
        received: true,
        matched: false,
      });
    }

    if (eventType === "email.delivered") {
      if (delivery.status !== "DELIVERED") {
        await db.orm.public.EmailDelivery.where({
          id: delivery.id,
          schoolId: delivery.schoolId,
        }).update({
          status: "DELIVERED",
          deliveredAt: new Date().toISOString(),
          nextRetryAt: null,
          lastError: null,
        });
      }
    } else if (delivery.status !== "DELIVERED") {
      await db.orm.public.EmailDelivery.where({
        id: delivery.id,
        schoolId: delivery.schoolId,
      }).update({
        status: "FAILED",
        nextRetryAt: null,
        lastError: "The email provider reported a bounce.",
      });
    }

    return NextResponse.json({
      received: true,
      matched: true,
    });
  } catch (error) {
    console.error("Failed to process Resend webhook.", {
      eventType,
      error,
    });

    return NextResponse.json(
      { error: "Unable to process the email event." },
      { status: 500 },
    );
  }
}
