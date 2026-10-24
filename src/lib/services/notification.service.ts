import { db } from "@/prisma/db";

import type { z } from "zod";
import type { createNotificationSchema } from "@/lib/validation/notification";

type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

type CreateNotificationData = CreateNotificationInput & {
  schoolId: number;
  createdByUserId: number;
};

export async function createSchoolNotification(input: CreateNotificationData) {
  const title = input.title.trim();
  const message = input.message.trim();

  if (title.length < 3 || title.length > 150) {
    throw new Error("Title must be between 3 and 150 characters.");
  }

  if (message.length < 5 || message.length > 5000) {
    throw new Error("Message must be between 5 and 5000 characters.");
  }

  let scheduledAt: string | null = null;

  if (input.scheduledAt !== undefined) {
    const scheduledDate = new Date(input.scheduledAt);

    if (
      Number.isNaN(scheduledDate.getTime()) ||
      scheduledDate.getTime() <= Date.now()
    ) {
      throw new Error("Scheduled delivery must be in the future.");
    }

    scheduledAt = scheduledDate.toISOString();
  }

  const [school, creator] = await Promise.all([
    db.orm.public.School.where({
      id: input.schoolId,
    }).first(),

    db.orm.public.User.where({
      id: input.createdByUserId,
      schoolId: input.schoolId,
    }).first(),
  ]);

  if (!school) {
    throw new Error("School not found.");
  }

  if (
    !creator ||
    !creator.isActive ||
    creator.mustChangePassword ||
    !["SCHOOL_OWNER", "SCHOOL_ADMIN"].includes(creator.role)
  ) {
    throw new Error("You are not authorized to send school notifications.");
  }

  if (scheduledAt) {
    const notification = await db.orm.public.Notification.create({
      schoolId: input.schoolId,
      createdByUserId: input.createdByUserId,
      title,
      message,
      category: input.category,
      status: "SCHEDULED",
      scheduledAt,
      sentAt: null,
    });

    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      category: notification.category,
      status: "SCHEDULED" as const,
      scheduledAt,
      sentAt: null,
      recipientCount: 0,
    };
  }

  const parentProfiles = await db.orm.public.Parent.where({
    schoolId: input.schoolId,
  }).all();

  const parentUserIds = [
    ...new Set(
      parentProfiles.flatMap((parent) =>
        parent.userId !== null ? [parent.userId] : [],
      ),
    ),
  ];

  const parentUsers =
    parentUserIds.length > 0
      ? await db.orm.public.User.where((user) =>
          user.id.in(parentUserIds),
        ).all()
      : [];

  const recipients = parentUsers.filter(
    (user) =>
      user.schoolId === input.schoolId &&
      user.isActive &&
      !user.mustChangePassword &&
      user.role === "PARENT",
  );

  if (recipients.length === 0) {
    throw new Error(
      "There are no active parent accounts available to receive this notification.",
    );
  }

  return db.transaction(async (tx) => {
    const notification = await tx.orm.public.Notification.create({
      schoolId: input.schoolId,
      createdByUserId: input.createdByUserId,
      title,
      message,
      category: input.category,
      status: "DRAFT",
      scheduledAt: null,
      sentAt: null,
    });

    for (const recipient of recipients) {
      await tx.orm.public.NotificationRecipient.create({
        notificationId: notification.id,
        userId: recipient.id,
        readAt: null,
      });
    }

    const sentAt = new Date().toISOString();

    await tx.orm.public.Notification.where({
      id: notification.id,
      schoolId: input.schoolId,
    }).update({
      status: "SENT",
      sentAt,
    });

    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      category: notification.category,
      status: "SENT" as const,
      sentAt,
      recipientCount: recipients.length,
    };
  });
}
