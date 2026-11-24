"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { schoolNavigation } from "./school-navigation";

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

  const paths: Record<string, React.ReactNode> = {
    dashboard: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></>,
    students: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1z" /><path d="M16 5.5a3 3 0 0 1 0 5.8M18 14a4 4 0 0 1 3 4v2" /></>,
    teachers: <><path d="M4 20v-1a6 6 0 0 1 12 0v1z" /><circle cx="10" cy="8" r="3" /><path d="M17 11l2 2 3-4" /></>,
    parents: <><circle cx="8" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M2 20v-1a6 6 0 0 1 12 0v1M15 16a5 5 0 0 1 7 4" /></>,
    classes: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
    subjects: <><path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /><path d="M8 14h2M14 14h2M8 17h2" /></>,
    assessments: <><path d="M8 3h8l4 4v14H4V3z" /><path d="M16 3v5h4M8 12h8M8 16h5" /></>,
    questions: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 2-1.5 3M12 17h.01" /></>,
    results: <><path d="M4 19V5M4 19h17" /><path d="M7 15l4-4 3 2 5-6" /></>,
    reports: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    categories: <><path d="M3 6h7l2 2h9v11H3z" /><path d="M3 9h18" /></>,
    fees: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M7 14h4" /><circle cx="17" cy="14" r="1" /></>,
    invoices: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2z" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
    payments: <><circle cx="12" cy="12" r="9" /><path d="M16 9.5c-.5-1-1.5-1.5-3-1.5-2 0-3 .8-3 2s1 2 3 2 3 1 3 2-1 2-3 2-2.5-.5-3-1.5M12 6v12" /></>,
    messages: <><path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9 9 0 0 1-4-.9L3 21l1.5-4A8.5 8.5 0 1 1 21 11.5z" /><path d="M8 11h8M8 14h5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.6v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.5-1H5.3v-2.6h.2A1.7 1.7 0 0 0 7 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2H14v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v2.6h-.2a1.7 1.7 0 0 0-1.5 1z" /></>,
    chevron: <><path d="m6 9 6 6 6-6" /></>,
  };

  return (
    <svg {...common} aria-hidden="true" className="shrink-0">
      {paths[name] ?? paths.dashboard}
    </svg>
  );
}

export default function SchoolNavigationMenu({ onNavigate }: Props) {
  const pathname = usePathname();

  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const activeGroup = schoolNavigation.find((group) =>
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
      {schoolNavigation.map((group) => {
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
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium transition whitespace-nowrap ${
                        active
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-200 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <NavigationIcon name={item.icon} />
                      <span className="min-w-0 truncate whitespace-nowrap">{item.label}</span>
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