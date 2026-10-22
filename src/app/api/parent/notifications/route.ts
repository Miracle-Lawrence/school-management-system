import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
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

    const user = await db.orm.public.User.where({
      id: userId,
    }).first();

    if (!user || !user.isActive || user.mustChangePassword) {
      return NextResponse.json(
        { error: "Your account cannot access notifications." },
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

    const recipientRecords = await db.orm.public.NotificationRecipient.where({
      userId,
    }).all();

    const visibleRecords = [];

    for (const recipient of recipientRecords) {
      const notification = await db.orm.public.Notification.where({
        id: recipient.notificationId,
        schoolId,
        status: "SENT",
      }).first();

      if (notification) {
        visibleRecords.push({
          id: recipient.id,
          readAt: recipient.readAt,
          createdAt: recipient.createdAt,
          notification: {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            category: notification.category,
            sentAt: notification.sentAt,
          },
        });
      }
    }

    visibleRecords.sort((a, b) => {
      const aTime = new Date(a.notification.sentAt ?? a.createdAt).getTime();

      const bTime = new Date(b.notification.sentAt ?? b.createdAt).getTime();

      return bTime - aTime;
    });

    return NextResponse.json(
      {
        notifications: visibleRecords,
        unreadCount: visibleRecords.filter((record) => record.readAt === null)
          .length,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load parent notifications.", error);

    return NextResponse.json(
      { error: "Unable to load notifications right now." },
      { status: 500 },
    );
  }
}
