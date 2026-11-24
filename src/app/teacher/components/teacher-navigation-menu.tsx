"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import TeacherNotificationBadge from "./TeacherNotificationBadge";
import { teacherNavigation } from "./teacher-navigation";

type Props = {
  onNavigate?: () => void;
};

function NavigationIcon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<string, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></>,
    classes: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
    attendance: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 9h18M8 14l2 2 5-5" /></>,
    notes: <><path d="M5 3h14v18H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    assessments: <><path d="M8 3h8l4 4v14H4V3z" /><path d="M16 3v5h4M8 12h8M8 16h5" /></>,
    questions: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 2-1.5 3M12 17h.01" /></>,
    assignments: <><path d="M8 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="m8 13 2 2 5-5" /></>,
    grading: <><path d="M4 3h16v18H4z" /><path d="M8 8h8M8 12h3M8 16h3M15 12l1 1 2-2" /></>,
    gradebook: <><path d="M4 19V5M4 19h17" /><path d="M7 15l4-4 3 2 5-7" /></>,
    results: <><path d="M4 19V5M4 19h17" /><path d="M7 15l4-4 3 2 5-6" /></>,
    comments: <><path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9 9 0 0 1-4-.9L3 21l1.5-4A8.5 8.5 0 1 1 21 11.5z" /><path d="M8 11h8M8 14h5" /></>,
    psychomotor: <><circle cx="12" cy="5" r="2" /><path d="m9 22 1-7-4 2-2-3 5-4h6l5 4-2 3-4-2 1 7M9 10l3 3 3-3" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    notifications: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
  };

  return (
    <svg {...common} aria-hidden="true" className="shrink-0">
      {paths[name] ?? paths.dashboard}
    </svg>
  );
}

export default function TeacherNavigationMenu({ onNavigate }: Props) {
  const pathname = usePathname();

  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const activeGroup = teacherNavigation.find((group) =>
    group.items.some((item) => isItemActive(item.href)),
  )?.label;

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(label: string) {
    setExpandedGroups((current) => ({
      ...current,
      [label]: !(current[label] ?? label === activeGroup),
    }));
  }

  return (
    <nav className="space-y-2">
      {teacherNavigation.map((group) => {
        const expanded = expandedGroups[group.label] ?? group.label === activeGroup;
        const groupActive = group.items.some((item) => isItemActive(item.href));

        return (
          <div key={group.label}>
            <button
              type="button"
              onClick={() => toggleGroup(group.label)}
              aria-expanded={expanded}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition ${
                groupActive
                  ? "text-blue-300"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span className="whitespace-nowrap text-[12px]">{group.label}</span>
              <span className={`transition-transform ${expanded ? "rotate-180" : ""}`}>
                <NavigationIcon name="chevron" />
              </span>
            </button>

            {expanded && (
              <div className="mt-1 space-y-1">
                {group.items.map((item) => {
                  const active = isItemActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium whitespace-nowrap transition ${
                        active
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-200 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <NavigationIcon name={item.icon} />
                      <span className="min-w-0 truncate whitespace-nowrap">
                        {item.label}
                      </span>
                      {item.href === "/teacher/notifications" ? (
                        <TeacherNotificationBadge compact />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}