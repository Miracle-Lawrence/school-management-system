"use client";

import { useCallback, useEffect, useState } from "react";

type StudentNotificationBadgeProps = {
  compact?: boolean;
};

export default function StudentNotificationBadge({
  compact = false,
}: StudentNotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/student/notifications", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) return;

      const data: { unreadCount?: number } = await response.json();

      if (
        typeof data.unreadCount === "number" &&
        Number.isFinite(data.unreadCount)
      ) {
        setUnreadCount(Math.max(0, Math.floor(data.unreadCount)));
      }
    } catch {
      // Keep the last known count if the network is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    void loadUnreadCount();

    const intervalId = window.setInterval(() => {
      void loadUnreadCount();
    }, 30_000);

    function handleFocus() {
      void loadUnreadCount();
    }

    function handleNotificationUpdate() {
      void loadUnreadCount();
    }

    window.addEventListener("focus", handleFocus);
    window.addEventListener(
      "student-notifications-updated",
      handleNotificationUpdate,
    );

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(
        "student-notifications-updated",
        handleNotificationUpdate,
      );
    };
  }, [loadUnreadCount]);

  if (unreadCount === 0) return null;

  const displayedCount = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <span
      aria-label={`${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
      title={`${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
      className={
        compact
          ? "ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
          : "ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-1 text-[10px] font-bold leading-none text-white"
      }
    >
      {displayedCount}
    </span>
  );
}
