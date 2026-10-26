import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ recipientId: string }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiRole(["STUDENT"]);

    if (session instanceof NextResponse) {
      return session;
    }

    const userId = Number(session.user.id);
    const schoolId = session.user.schoolId;
    const { recipientId: recipientIdParam } = await context.params;
    const recipientId = Number(recipientIdParam);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      !schoolId ||
      !Number.isSafeInteger(recipientId) ||
      recipientId <= 0
    ) {
      return NextResponse.json(
        { error: "Valid student and notification context are required." },
        { status: 400 },
      );
    }

    const user = await db.orm.public.User.where({ id: userId }).first();

    if (!user || !user.isActive || user.mustChangePassword) {
      return NextResponse.json(
        { error: "Your account cannot update notifications." },
        { status: 403 },
      );
    }

    const student = await db.orm.public.Student.where({ userId }).first();

    if (!student || student.schoolId !== schoolId || !student.isActive) {
      return NextResponse.json(
        { error: "Student profile not found." },
        { status: 403 },
      );
    }

    const recipient = await db.orm.public.NotificationRecipient.where({
      id: recipientId,
      userId,
    }).first();

    if (!recipient) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 },
      );
    }

    const notification = await db.orm.public.Notification.where({
      id: recipient.notificationId,
      schoolId,
      status: "SENT",
    }).first();

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 },
      );
    }

    if (recipient.readAt === null) {
      await db.orm.public.NotificationRecipient.where({
        id: recipient.id,
        userId,
      }).update({
        readAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: true, recipientId: recipient.id },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to mark student notification as read.", error);

    return NextResponse.json(
      { error: "Unable to update this notification right now." },
      { status: 500 },
    );
  }
}
