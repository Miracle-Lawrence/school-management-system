import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import { createSchoolNotification } from "@/lib/services/notification.service";
import { createNotificationSchema } from "@/lib/validation/notification";
import { db } from "@/prisma/db";

export async function GET() {
  try {
    const session = await requireApiRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

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

    const notifications = await db.orm.public.Notification.where({
      schoolId,
    }).all();

    const sortedNotifications = notifications.sort((a, b) => {
      const aTime = a.sentAt ?? a.createdAt;
      const bTime = b.sentAt ?? b.createdAt;

      return bTime.localeCompare(aTime);
    });

    const result = await Promise.all(
      sortedNotifications.map(async (notification) => {
        const recipients = await db.orm.public.NotificationRecipient.where({
          notificationId: notification.id,
        }).all();

        return {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          category: notification.category,
          audience: notification.audience,
          status: notification.status,
          scheduledAt: notification.scheduledAt,
          sentAt: notification.sentAt,
          createdAt: notification.createdAt,
          recipientCount: recipients.length,
        };
      }),
    );

    return NextResponse.json(
      { notifications: result },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load school notifications:", error);

    return NextResponse.json(
      { error: "Unable to load notifications." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    if (session instanceof NextResponse) {
      return session;
    }

    const schoolId = session.user.schoolId;
    const createdByUserId = Number(session.user.id);

    if (
      !schoolId ||
      !Number.isSafeInteger(createdByUserId) ||
      createdByUserId <= 0
    ) {
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
        { error: "Request body must contain valid JSON." },
        { status: 400 },
      );
    }

    const parsed = createNotificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please correct the notification details.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const notification = await createSchoolNotification({
      ...parsed.data,
      schoolId,
      createdByUserId,
    });

   
return NextResponse.json(
  {
    message:
      notification.status === "SCHEDULED"
        ? "Notification scheduled successfully."
        : "Notification sent successfully.",
    notification,
  },
  { status: 201 },
);

  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send notification.";

    if (
      message.startsWith("There are no active ") &&
      message.includes(" accounts available to receive this notification.")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message.startsWith("Fee reminders can only be sent to parents.")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message === "School not found.") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message === "You are not authorized to send school notifications.") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    
if (message === "Scheduled delivery must be in the future.") {
  return NextResponse.json({ error: message }, { status: 400 });
}


    console.error("Failed to send school notification:", error);

    return NextResponse.json(
      { error: "Unable to send notification." },
      { status: 500 },
    );
  }
}


export async function PATCH(request: Request) {
  try {
    const session = await requireApiRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

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
        { error: "Request body must contain valid JSON." },
        { status: 400 },
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("notificationId" in body) ||
      typeof body.notificationId !== "number" ||
      !Number.isSafeInteger(body.notificationId) ||
      body.notificationId <= 0
    ) {
      return NextResponse.json(
        { error: "A valid notification ID is required." },
        { status: 400 },
      );
    }

    const notification = await db.orm.public.Notification.where({
      id: body.notificationId,
      schoolId,
    }).first();

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 },
      );
    }

    if (notification.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Only scheduled notifications can be cancelled." },
        { status: 409 },
      );
    }

    await db.orm.public.Notification.where({
      id: notification.id,
      schoolId,
    }).update({
      status: "CANCELLED",
    });

    return NextResponse.json({
      message: "Scheduled notification cancelled.",
      notificationId: notification.id,
    });
  } catch (error) {
    console.error("Failed to cancel scheduled notification:", error);

    return NextResponse.json(
      { error: "Unable to cancel scheduled notification." },
      { status: 500 },
    );
  }
}

