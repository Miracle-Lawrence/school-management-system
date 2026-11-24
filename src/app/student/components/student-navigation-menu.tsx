"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import StudentNotificationBadge from "./StudentNotificationBadge";
import { StudentContentUnreadBadge } from "./StudentContentUnreadBadges";
import { studentNavigation } from "./student-navigation";

type StudentNavigationMenuProps = {
  compact?: boolean;
  onNavigate?: () => void;
};

function NavigationIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
    profile: "M20 21a8 8 0 0 0-16 0 M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    subjects: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
    assignments: "M9 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4 M9 3h6v4H9z M8 12h8 M8 16h8",
    exams: "M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3 M8 3h8v4H8z M8 13l2 2 5-5",
    notes: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h8",
    results: "M4 19V5 M4 19h17 M8 15l4-4 3 2 5-7",
    attendance: "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    announcements: "M3 11v2a2 2 0 0 0 2 2h2l4 5V4l-4 5H5a2 2 0 0 0-2 2z M11 9l9-4v14l-9-4 M7 15l1 5",
    notifications: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
    settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.5 2.6-.2-.1a1.7 1.7 0 0 0-1.9.3l-.1.1h-3l-.1-.2a1.7 1.7 0 0 0-1.9-.3l-.1.1-2.6-1.5.1-.2a1.7 1.7 0 0 0-.3-1.9l-.1-.1v-3l.2-.1a1.7 1.7 0 0 0 .3-1.9l-.1-.1 1.5-2.6.2.1a1.7 1.7 0 0 0 1.9-.3l.1-.1h3l.1.2a1.7 1.7 0 0 0 1.9.3l.1-.1 2.6 1.5-.1.2a1.7 1.7 0 0 0 .3 1.9l.1.1v3z",
  };

  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d={paths[name] ?? paths.dashboard} />
    </svg>
  );
}

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function StudentNavigationMenu({
  compact = false,
  onNavigate,
}: StudentNavigationMenuProps) {
  const pathname = usePathname();

  const activeGroup = studentNavigation.find((group) =>
    group.items.some((item) => isItemActive(pathname, item.href)),
  )?.label;

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(label: string) {
    setExpandedGroups((current) => ({
      ...current,
      [label]: !(current[label] ?? label === activeGroup),
    }));
  }

  return (
    <nav aria-label={compact ? "Student mobile navigation" : "Student navigation"}>
      <div className="space-y-3">
        {studentNavigation.map((group) => {
          const expanded = expandedGroups[group.label] ?? group.label === activeGroup;
          const groupActive = group.label === activeGroup;

          return (
            <section key={group.label}>
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                aria-expanded={expanded}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold tracking-wide transition ${
                  groupActive ? "text-blue-300" : "text-slate-400"
                } hover:bg-slate-800 hover:text-white`}
              >
                <span>{group.label}</span>
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {expanded && (
                <div className="mt-1 space-y-1">
                  {group.items.map((item) => {
                    const active = isItemActive(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                          active
                            ? "bg-blue-600 text-white"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <NavigationIcon name={item.icon} />
                        <span className="min-w-0 flex-1">{item.label}</span>

                        {item.href === "/student/class-notes" && (
                          <StudentContentUnreadBadge type="classNotes" compact={compact} />
                        )}

                        {item.href === "/student/assignments" && (
                          <span className="ml-auto flex items-center gap-1.5">
                            <StudentContentUnreadBadge type="assignments" compact={compact} />
                            <StudentContentUnreadBadge type="gradedAssignments" compact={compact} />
                          </span>
                        )}

                        {item.href === "/student/results" && (
                          <StudentContentUnreadBadge type="results" compact={compact} />
                        )}

                        {item.href === "/student/notifications" && (
                          <StudentNotificationBadge compact={compact} />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </nav>
  );
}