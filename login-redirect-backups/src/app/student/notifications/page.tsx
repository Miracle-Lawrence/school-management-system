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

export default async function StudentNotificationsPage() {
  const session = await requireRole(["STUDENT"]);
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
    redirect("/student/change-password");
  }

  const student = await db.orm.public.Student.where({ userId }).first();

  if (!student || student.schoolId !== schoolId || !student.isActive) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-3 text-slate-600">
          Your student profile is not linked correctly. Please contact your
          school administrator.
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

    if (notification) {
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
          <p className="text-sm font-semibold text-blue-600">Student portal</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Stay updated with school announcements, fee reminders, results,
            events, and other important messages.
          </p>
        </div>

        <div className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-500">Unread</p>
          <p className="text-2xl font-bold text-slate-900">{unreadCount}</p>
        </div>
      </header>

      <div>
        <Link
          href="/student/dashboard"
          className="text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          &larr; Back to dashboard
        </Link>
      </div>

      {notifications.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            You are all caught up
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            You have no notifications yet. New messages from your school will
            appear here.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {notifications.map((notification) => (
            <article
              key={notification.recipientId}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {categoryLabels[notification.category] ??
                        notification.category}
                    </span>

                    {notification.readAt === null ? (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        Unread
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
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
              </div>

              {notification.readAt === null && (
                <MarkAsReadButton recipientId={notification.recipientId} />
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
