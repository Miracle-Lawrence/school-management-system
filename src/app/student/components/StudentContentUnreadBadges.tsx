"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type StudentContentCounts = {
  classNotes: number;
  assignments: number;
  gradedAssignments: number;
  results: number;
};

type StudentContentType = keyof StudentContentCounts;

type StudentContentUnreadContextValue = {
  counts: StudentContentCounts;
};

const EMPTY_COUNTS: StudentContentCounts = {
  classNotes: 0,
  assignments: 0,
  gradedAssignments: 0,
  results: 0,
};

const StudentContentUnreadContext =
  createContext<StudentContentUnreadContextValue | null>(null);

type StudentContentUnreadProviderProps = {
  children: ReactNode;
};

export function StudentContentUnreadProvider({
  children,
}: StudentContentUnreadProviderProps) {
  const [counts, setCounts] =
    useState<StudentContentCounts>(EMPTY_COUNTS);

  const loadCounts = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/student/content-unread-counts",
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        return;
      }

      const data: { counts?: Partial<StudentContentCounts> } =
        await response.json();

      if (!data.counts || typeof data.counts !== "object") {
        return;
      }

      setCounts((previous) => {
        const next = { ...previous };

        for (const key of Object.keys(
          EMPTY_COUNTS,
        ) as StudentContentType[]) {
          const value = data.counts?.[key];

          if (typeof value === "number" && Number.isFinite(value)) {
            next[key] = Math.max(0, Math.floor(value));
          }
        }

        return next;
      });
    } catch {
      // Preserve the last known counts during temporary network errors.
    }
  }, []);

  useEffect(() => {
    void loadCounts();

    const intervalId = window.setInterval(() => {
      void loadCounts();
    }, 30_000);

    function handleFocus() {
      void loadCounts();
    }

    function handleContentReadUpdate() {
      void loadCounts();
    }

    window.addEventListener("focus", handleFocus);
    window.addEventListener(
      "student-content-reads-updated",
      handleContentReadUpdate,
    );

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(
        "student-content-reads-updated",
        handleContentReadUpdate,
      );
    };
  }, [loadCounts]);

  return (
    <StudentContentUnreadContext.Provider value={{ counts }}>
      {children}
    </StudentContentUnreadContext.Provider>
  );
}

type StudentContentUnreadBadgeProps = {
  type: StudentContentType;
  compact?: boolean;
};

const BADGE_LABELS: Record<StudentContentType, string> = {
  classNotes: "unread class notes",
  assignments: "unread assignments",
  gradedAssignments: "unread graded assignments",
  results: "unread results",
};

export function StudentContentUnreadBadge({
  type,
  compact = false,
}: StudentContentUnreadBadgeProps) {
  const context = useContext(StudentContentUnreadContext);
  const unreadCount = context?.counts[type] ?? 0;

  if (unreadCount === 0) {
    return null;
  }

  const displayedCount = unreadCount > 99 ? "99+" : unreadCount;
  const label = BADGE_LABELS[type];
  const accessibleLabel = `${unreadCount} ${label}`;

  return (
    <span
      aria-label={accessibleLabel}
      title={accessibleLabel}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 font-bold leading-none text-white ${
        compact
          ? "min-w-5 py-0.5 text-[10px]"
          : "min-w-5 py-1 text-[10px]"
      }`}
    >
      {displayedCount}
    </span>
  );
}
