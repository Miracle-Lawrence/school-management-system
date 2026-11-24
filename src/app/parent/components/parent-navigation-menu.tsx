"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ParentNotificationBadge from "./ParentNotificationBadge";
import { parentNavigation } from "./parent-navigation";

type ParentNavigationMenuProps = {
  compact?: boolean;
  onNavigate?: () => void;
};

function NavigationIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </>
    ),
    finance: (
      <>
        <rect x="2.5" y="5" width="19" height="14" rx="2" />
        <path d="M2.5 10h19M7 15h3" />
      </>
    ),
    reports: (
      <>
        <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </>
    ),
    notifications: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {paths[name] ?? null}
    </svg>
  );
}

export default function ParentNavigationMenu({
  compact = false,
  onNavigate,
}: ParentNavigationMenuProps) {
  const pathname = usePathname();

  function isItemActive(href: string) {
    return (
      pathname === href ||
      (href === "/parent/finance" && pathname.startsWith("/parent/finance/"))
    );
  }

  const activeGroup =
    parentNavigation.find((group) =>
      group.items.some((item) => isItemActive(item.href)),
    )?.label ?? "Overview";

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(label: string) {
    setExpandedGroups((current) => ({
      ...current,
      [label]: !(current[label] ?? label === activeGroup),
    }));
  }

  return (
    <nav aria-label="Parent navigation" className="space-y-2">
      {parentNavigation.map((group) => {
        const expanded = expandedGroups[group.label] ?? group.label === activeGroup;
        const groupId = `parent-nav-${group.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

        return (
          <section key={group.label}>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={groupId}
              onClick={() => toggleGroup(group.label)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-slate-400 transition hover:text-white"
            >
              <span className="whitespace-nowrap text-[12px] font-semibold uppercase tracking-wide">
                {group.label}
              </span>
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
                className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {expanded && (
              <div id={groupId} className="mt-1 space-y-1">
                {group.items.map((item) => {
                  const active = isItemActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                        active
                          ? "bg-blue-600 text-white"
                          : "text-slate-200 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <NavigationIcon name={item.icon} />
                      <span className="min-w-0 flex-1">{item.label}</span>
                      {item.href === "/parent/notifications" && (
                        <ParentNotificationBadge compact={compact} />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </nav>
  );
}