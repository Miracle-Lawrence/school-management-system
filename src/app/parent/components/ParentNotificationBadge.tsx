"use client";

import { useCallback, useEffect, useState } from "react";

type ParentNotificationBadgeProps = {
  compact?: boolean;
};

export default function ParentNotificationBadge({
  compact = false,
}: ParentNotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/parent/notifications", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
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

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadUnreadCount]);

  if (unreadCount === 0) return null;

  const displayedCount = unreadCount > 99 ? "99+" : unreadCount;
  const accessibleLabel = `${unreadCount} unread notification${
    unreadCount === 1 ? "" : "s"
  }`;

  return (
    <span
      aria-label={accessibleLabel}
      title={accessibleLabel}
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
