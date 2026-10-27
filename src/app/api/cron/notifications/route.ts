import { NextResponse } from "next/server";

import { resolveNotificationRecipients } from "@/lib/services/notification.service";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Scheduled notification processing is not configured." },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const now = new Date();
  const nowIso = now.toISOString();

  try {
    const scheduledNotifications = await db.orm.public.Notification.where({
      status: "SCHEDULED",
    }).all();

    const dueNotifications = scheduledNotifications.filter(
      (notification) =>
        notification.scheduledAt !== null &&
        new Date(notification.scheduledAt).getTime() <= now.getTime(),
    );

    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const notification of dueNotifications) {
      try {
        const recipients = await resolveNotificationRecipients(
          db.orm,
          notification.schoolId,
          notification.audience ?? "PARENTS",
        );

        const result = await db.transaction(async (tx) => {
          const current = await tx.orm.public.Notification.where({
            id: notification.id,
            schoolId: notification.schoolId,
          }).first();

          if (
            !current ||
            current.status !== "SCHEDULED" ||
            !current.scheduledAt ||
            new Date(current.scheduledAt).getTime() > Date.now()
          ) {
            return "SKIPPED" as const;
          }

          if (recipients.length === 0) {
            await tx.orm.public.Notification.where({
              id: current.id,
              schoolId: current.schoolId,
              status: "SCHEDULED",
            }).update({
              status: "CANCELLED",
            });

            return "NO_RECIPIENTS" as const;
          }

          for (const recipient of recipients) {
            await tx.orm.public.NotificationRecipient.create({
              notificationId: current.id,
              userId: recipient.id,
              readAt: null,
            });
          }

          await tx.orm.public.Notification.where({
            id: current.id,
            schoolId: current.schoolId,
            status: "SCHEDULED",
          }).update({
            status: "SENT",
            sentAt: nowIso,
          });

          return "SENT" as const;
        });

        if (result === "SENT") {
          sentCount += 1;
        } else {
          skippedCount += 1;

          if (result === "NO_RECIPIENTS") {
            console.warn(
              "Scheduled notification cancelled because no eligible accounts were available for its audience.",
              {
                notificationId: notification.id,
                audience: notification.audience,
              },
            );
          }
        }
      } catch (error) {
        failedCount += 1;

        console.error("Failed to process scheduled notification.", {
          notificationId: notification.id,
          error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      checkedCount: dueNotifications.length,
      sentCount,
      skippedCount,
      failedCount,
      processedAt: nowIso,
    });
  } catch (error) {
    console.error("Scheduled notification worker failed:", error);

    return NextResponse.json(
      { error: "Unable to process scheduled notifications." },
      { status: 500 },
    );
  }
}
