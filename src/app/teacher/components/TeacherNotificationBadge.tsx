"use client";

import { useCallback, useEffect, useState } from "react";

type TeacherNotificationBadgeProps = {
  compact?: boolean;
};

export default function TeacherNotificationBadge({
  compact = false,
}: TeacherNotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/teacher/notifications", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return;
      }

      const result: { unreadCount?: number } = await response.json();

      setUnreadCount(
        typeof result.unreadCount === "number" &&
          Number.isFinite(result.unreadCount)
          ? Math.max(0, result.unreadCount)
          : 0,
      );
    } catch {
      // Keep the last successful count if the network request fails.
    }
  }, []);

  useEffect(() => {
    void refreshUnreadCount();

    const intervalId = window.setInterval(() => {
      void refreshUnreadCount();
    }, 30_000);

    const handleFocus = () => {
      void refreshUnreadCount();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshUnreadCount]);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span
      aria-label={`${unreadCount} unread notifications`}
      className={
        compact
          ? "ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white"
          : "ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white"
      }
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}
