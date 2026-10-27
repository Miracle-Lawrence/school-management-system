import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

import MarkAsReadButton from "./mark-as-read-button";

const categoryLabels: Record<string, string> = {
  FEE_REMINDER: "Fee reminder",
  REPORT_PUBLISHED: "Report published",
  ACADEMIC: "Academic",
  EVENT: "Event",
  ANNOUNCEMENT: "Announcement",
  URGENT: "Urgent",
};

function formatDate(value: Date | string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function TeacherNotificationsPage() {
  const session = await requireRole(["TEACHER"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (!Number.isSafeInteger(userId) || userId <= 0 || !schoolId) {
    redirect("/login");
  }

  const user = await db.orm.public.User.where({ id: userId }).first();

  if (!user || !user.isActive) {
    redirect("/login");
  }

  if (user.mustChangePassword) {
    redirect("/teacher/change-password");
  }

  const teacher = await db.orm.public.Teacher.where({ userId }).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-3 text-slate-600">
          Your teacher profile is not linked yet. Please contact your school
          administrator.
        </p>
      </main>
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

  const unreadCount = notifications.filter(
    (notification) => notification.readAt === null,
  ).length;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Teacher portal</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            School announcements, academic updates, events, and important
            messages for teachers.
          </p>
        </div>

        <div className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-500">Unread</p>
          <p className="text-2xl font-bold text-slate-900">{unreadCount}</p>
        </div>
      </header>

      <div>
        <Link
          href="/teacher/dashboard"
          className="text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          &larr; Back to dashboard
        </Link>
      </div>

      {notifications.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            No notifications yet
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Notifications intended for teachers will appear here.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {notifications.map((notification) => (
            <article
              key={notification.recipientId}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${
                notification.readAt === null
                  ? "border-blue-200"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {categoryLabels[notification.category] ??
                        notification.category}
                    </span>

                    {notification.readAt === null ? (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        Unread
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                        Read
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 text-lg font-semibold text-slate-900">
                    {notification.title}
                  </h2>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {notification.message}
                  </p>

                  <p className="mt-3 text-xs text-slate-500">
                    {formatDate(notification.sentAt ?? notification.createdAt)}
                  </p>
                </div>

                {notification.readAt === null ? (
                  <MarkAsReadButton
                    recipientId={notification.recipientId}
                  />
                ) : null}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
