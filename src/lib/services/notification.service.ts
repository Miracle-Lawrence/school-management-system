import { db } from "@/prisma/db";

import type { z } from "zod";
import type { createNotificationSchema } from "@/lib/validation/notification";

type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

type NotificationAudience = CreateNotificationInput["audience"];

type CreateNotificationData = CreateNotificationInput & {
  schoolId: number;
  createdByUserId: number;
};

type NotificationOrm = typeof db.orm;

const audienceRoles: Record<NotificationAudience, string[]> = {
  PARENTS: ["PARENT"],
  STUDENTS: ["STUDENT"],
  TEACHERS: ["TEACHER"],
  EVERYONE: ["PARENT", "STUDENT", "TEACHER"],
};

/**
 * Resolves active, eligible portal accounts for one school and audience.
 * Profile links are used to ensure that only actual school parents,
 * students, and teachers are selected.
 */
export async function resolveNotificationRecipients(
  orm: NotificationOrm,
  schoolId: number,
  audience: NotificationAudience,
) {
  const userIds = new Set<number>();

  if (audience === "PARENTS" || audience === "EVERYONE") {
    const profiles = await orm.public.Parent.where({ schoolId }).all();

    for (const profile of profiles) {
      if (profile.userId !== null) {
        userIds.add(profile.userId);
      }
    }
  }

  if (audience === "STUDENTS" || audience === "EVERYONE") {
    const profiles = await orm.public.Student.where({
      schoolId,
      isActive: true,
    }).all();

    for (const profile of profiles) {
      if (profile.userId !== null) {
        userIds.add(profile.userId);
      }
    }
  }

  if (audience === "TEACHERS" || audience === "EVERYONE") {
    const profiles = await orm.public.Teacher.where({ schoolId }).all();

    for (const profile of profiles) {
      if (profile.userId !== null) {
        userIds.add(profile.userId);
      }
    }
  }

  const ids = [...userIds];

  if (ids.length === 0) {
    return [];
  }

  const users = await orm.public.User.where((user) =>
    user.id.in(ids),
  ).all();

  const allowedRoles = audienceRoles[audience];

  return users.filter(
    (user) =>
      user.schoolId === schoolId &&
      user.isActive &&
      !user.mustChangePassword &&
      allowedRoles.includes(user.role),
  );
}

export async function createSchoolNotification(
  input: CreateNotificationData,
) {
  const title = input.title.trim();
  const message = input.message.trim();
  const audience = input.audience ?? "PARENTS";

  if (title.length < 3 || title.length > 150) {
    throw new Error("Title must be between 3 and 150 characters.");
  }

  if (message.length < 5 || message.length > 5000) {
    throw new Error("Message must be between 5 and 5000 characters.");
  }

  if (input.category === "FEE_REMINDER" && audience !== "PARENTS") {
    throw new Error(
      "Fee reminders can only be sent to parents. Individual fee balances must not be broadcast to other audiences.",
    );
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
      audience,
      status: "SCHEDULED",
      scheduledAt,
      sentAt: null,
    });

    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      category: notification.category,
      audience: notification.audience,
      status: "SCHEDULED" as const,
      scheduledAt,
      sentAt: null,
      recipientCount: 0,
    };
  }

  const recipients = await resolveNotificationRecipients(
    db.orm,
    input.schoolId,
    audience,
  );

  if (recipients.length === 0) {
    throw new Error(
      `There are no active ${audience.toLowerCase()} accounts available to receive this notification.`,
    );
  }

  return db.transaction(async (tx) => {
    const notification = await tx.orm.public.Notification.create({
      schoolId: input.schoolId,
      createdByUserId: input.createdByUserId,
      title,
      message,
      category: input.category,
      audience,
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
      audience: notification.audience,
      status: "SENT" as const,
      sentAt,
      recipientCount: recipients.length,
    };
  });
}
