"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { platformNavigation } from "./platform-navigation";

type PlatformNavigationMenuProps = {
  onNavigate?: () => void;
};

function NavigationIcon({ name }: { name: string }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="5" rx="1.5" />
          <rect x="13" y="10" width="8" height="11" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
        </svg>
      );
    case "schools":
      return (
        <svg {...common}>
          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 9h.01M15 9h.01M9 12h.01M15 12h.01" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="10" cy="7" r="4" />
          <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "plans":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h4" />
        </svg>
      );
    case "subscriptions":
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h16" />
          <circle cx="8" cy="7" r="2" />
          <circle cx="16" cy="12" r="2" />
          <circle cx="10" cy="17" r="2" />
        </svg>
      );
    case "records":
      return (
        <svg {...common}>
          <path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case "rates":
      return (
        <svg {...common}>
          <path d="M12 3v18M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H7" />
        </svg>
      );
    case "invoices":
      return (
        <svg {...common}>
          <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7" />
        </svg>
      );
    case "payments":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18M7 15h3" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function PlatformNavigationMenu({
  onNavigate,
}: PlatformNavigationMenuProps) {
  const pathname = usePathname();

  const activeGroup = platformNavigation.find((group) =>
    group.items.some(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`),
    ),
  )?.label;

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(label: string) {
    setExpandedGroups((current) => ({
      ...current,
      [label]: !(current[label] ?? label === activeGroup),
    }));
  }

  return (
    <nav aria-label="Platform navigation" className="space-y-3">
      {platformNavigation.map((group) => {
        const expanded = expandedGroups[group.label] ?? group.label === activeGroup;
        const groupIsActive = activeGroup === group.label;

        return (
          <section key={group.label}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => toggleGroup(group.label)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider transition ${
                groupIsActive
                  ? "text-blue-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <span>{group.label}</span>
              <svg
                viewBox="0 0 20 20"
                className={`h-4 w-4 transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="m5 7 5 5 5-5" />
              </svg>
            </button>

            {expanded && (
              <div className="mt-1 space-y-1">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium transition-colors ${
                        active
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-950/20"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
                          active
                            ? "bg-white/15 text-white"
                            : "bg-white/5 text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-300"
                        }`}
                      >
                        <NavigationIcon name={item.icon} />
                      </span>
                      <span>{item.name}</span>
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