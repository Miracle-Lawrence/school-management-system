import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { redirect } from "next/navigation";

function formatDate(value: unknown): string {
  if (!value) return "Date unavailable";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function StudentAnnouncementsPage() {
  const session = await requireRole(["STUDENT"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (!Number.isInteger(userId) || !schoolId) {
    redirect("/login");
  }

  const student = await db.orm.public.Student.where(
    (item) => item.userId.eq(userId),
  ).first();

  if (!student || student.schoolId !== schoolId || !student.isActive) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold text-amber-900">
          Announcements unavailable
        </h1>
        <p className="mt-2 text-sm text-amber-800">
          Your student profile is not linked to an active school record.
          Please contact your school administrator.
        </p>
      </section>
    );
  }

  const recipientRecords = await db.orm.public.NotificationRecipient.where(
    (item) => item.userId.eq(userId),
  ).all();

  const notificationIds = [
    ...new Set(recipientRecords.map((recipient) => recipient.notificationId)),
  ];

  const notificationResults = await Promise.all(
    notificationIds.map((id) =>
      db.orm.public.Notification.where(
        (item) => item.id.eq(id),
      ).first(),
    ),
  );

  const announcements = notificationResults
    .filter(
      (notification) =>
        notification &&
        notification.schoolId === schoolId &&
        notification.category === "ANNOUNCEMENT" &&
        notification.status === "SENT",
    )
    .map((notification) => {
      const recipient = recipientRecords.find(
        (item) => item.notificationId === notification!.id,
      );

      return {
        ...notification!,
        readAt: recipient?.readAt ?? null,
      };
    })
    .sort((a, b) => {
      const dateA = new Date(
        String(a.sentAt ?? a.createdAt),
      ).getTime();
      const dateB = new Date(
        String(b.sentAt ?? b.createdAt),
      ).getTime();

      return dateB - dateA;
    });

  const unreadCount = announcements.filter(
    (announcement) => !announcement.readAt,
  ).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Student Portal
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Announcements
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Stay informed about important messages from your school.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500">Total announcements</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {announcements.length}
            </p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
            <p className="text-xs text-blue-700">Unread</p>
            <p className="mt-1 text-2xl font-bold text-blue-800">
              {unreadCount}
            </p>
          </div>
        </div>
      </section>

      {announcements.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
            📢
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No announcements yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Announcements sent to your student account will appear here.
            Check back later for updates from your school.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
                    📢
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {announcement.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Published{" "}
                      {formatDate(
                        announcement.sentAt ?? announcement.createdAt,
                      )}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    announcement.readAt
                      ? "bg-slate-100 text-slate-600"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {announcement.readAt ? "Read" : "Unread"}
                </span>
              </div>

              <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                {announcement.message}
              </div>

              {announcement.readAt && (
                <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  Read on {formatDate(announcement.readAt)}
                </p>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
