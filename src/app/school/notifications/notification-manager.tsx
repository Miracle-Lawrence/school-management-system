"use client";

import { useCallback, useEffect, useState } from "react";

type NotificationCategory =
  | "FEE_REMINDER"
  | "REPORT_PUBLISHED"
  | "ACADEMIC"
  | "EVENT"
  | "ANNOUNCEMENT"
  | "URGENT";

type SchoolNotification = {
  id: number;
  title: string;
  message: string;
  category: NotificationCategory;
  status: "DRAFT" | "SCHEDULED" | "SENT" | "CANCELLED";
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  recipientCount: number;
};

const categories: {
  value: NotificationCategory;
  label: string;
}[] = [
  { value: "ANNOUNCEMENT", label: "General announcement" },
  { value: "ACADEMIC", label: "Academic update" },
  { value: "FEE_REMINDER", label: "Fee reminder" },
  { value: "REPORT_PUBLISHED", label: "Report published" },
  { value: "EVENT", label: "School event" },
  { value: "URGENT", label: "Urgent notice" },
];

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function categoryLabel(category: NotificationCategory) {
  return categories.find((item) => item.value === category)?.label ?? category;
}

export default function NotificationManager() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] =
    useState<NotificationCategory>("ANNOUNCEMENT");

  const [notifications, setNotifications] = useState<SchoolNotification[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/school/notifications", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load notifications.");
      }

      setNotifications(data.notifications ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const confirmed = window.confirm(
      "Send this notification to all active parent accounts linked to your school? This action cannot currently be undone.",
    );

    if (!confirmed) return;

    setSubmitting(true);

    try {
      const response = await fetch("/api/school/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message,
          category,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to send notification.");
      }

      setSuccess(
        `Notification sent successfully to ${data.notification.recipientCount} parent account(s).`,
      );

      setTitle("");
      setMessage("");
      setCategory("ANNOUNCEMENT");

      await loadNotifications();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to send notification.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Compose a notification</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Your notification will be delivered to all active parent accounts
            linked to your school.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800"
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="notification-title" className="text-sm font-medium">
              Notification title
            </label>

            <input
              id="notification-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={3}
              maxLength={150}
              required
              placeholder="e.g. Parents' General Meeting"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />

            <p className="text-xs text-muted-foreground">
              {title.length}/150 characters
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="notification-category"
              className="text-sm font-medium"
            >
              Category
            </label>

            <select
              id="notification-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as NotificationCategory)
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="notification-message"
              className="text-sm font-medium"
            >
              Message
            </label>

            <textarea
              id="notification-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              minLength={5}
              maxLength={5000}
              required
              rows={6}
              placeholder="Write the information you want to communicate to parents..."
              className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />

            <p className="text-xs text-muted-foreground">
              {message.length}/5000 characters
            </p>
          </div>

          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <strong>Audience:</strong> All active parent accounts linked to your
            school. Do not include an individual student's private fee balance
            or other confidential information in a school-wide message.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send notification"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Notification history</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Review the notifications created by your school and the number of
            parent accounts targeted.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">
            Loading notification history...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border p-8 text-center">
            <h3 className="font-medium">No notifications yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your sent notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className="rounded-xl border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                        {categoryLabel(notification.category)}
                      </span>

                      <span className="rounded-full border px-2.5 py-1 text-xs">
                        {notification.status}
                      </span>
                    </div>

                    <h3 className="font-semibold">{notification.title}</h3>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>

                  <div className="shrink-0 text-sm sm:text-right">
                    <p className="font-medium">
                      {notification.recipientCount} recipient(s)
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(
                        notification.sentAt ?? notification.createdAt,
                      )}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
