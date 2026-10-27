import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireApiRole(["TEACHER"]);

    if (session instanceof NextResponse) {
      return session;
    }

    const userId = Number(session.user.id);
    const schoolId = session.user.schoolId;

    if (!Number.isSafeInteger(userId) || userId <= 0 || !schoolId) {
      return NextResponse.json(
        { error: "Valid teacher and school context are required." },
        { status: 400 },
      );
    }

    const user = await db.orm.public.User.where({ id: userId }).first();

    if (!user || !user.isActive || user.mustChangePassword) {
      return NextResponse.json(
        { error: "Your account cannot access notifications." },
        { status: 403 },
      );
    }

    const teacher = await db.orm.public.Teacher.where({ userId }).first();

    if (!teacher || teacher.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Teacher profile not found." },
        { status: 403 },
      );
    }

    const recipientRecords =
      await db.orm.public.NotificationRecipient.where({ userId }).all();

    const notifications = [];

    for (const recipient of recipientRecords) {
      const notification = await db.orm.public.Notification.where({
        id: recipient.notificationId,
        schoolId,
        status: "SENT",
      }).first();

      if (
        notification &&
        (notification.audience === "TEACHERS" ||
          notification.audience === "EVERYONE")
      ) {
        notifications.push({
          recipientId: recipient.id,
          readAt: recipient.readAt,
          createdAt: recipient.createdAt,
          id: notification.id,
          title: notification.title,
          message: notification.message,
          category: notification.category,
          sentAt: notification.sentAt,
        });
      }
    }

    notifications.sort((a, b) => {
      const aTime = new Date(a.sentAt ?? a.createdAt).getTime();
      const bTime = new Date(b.sentAt ?? b.createdAt).getTime();

      return bTime - aTime;
    });

    return NextResponse.json(
      {
        notifications,
        unreadCount: notifications.filter(
          (notification) => notification.readAt === null,
        ).length,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load teacher notifications.", error);

    return NextResponse.json(
      { error: "Unable to load notifications right now." },
      { status: 500 },
    );
  }
}
