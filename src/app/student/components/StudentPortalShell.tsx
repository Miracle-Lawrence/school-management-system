"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import StudentMobileNavigation from "./student-mobile-navigation";

const navigation = [
  { label: "Dashboard", href: "/student/dashboard", icon: "⌂" },
  { label: "My Profile", href: "/student/profile", icon: "◉" },
  { label: "My Class & Subjects", href: "/student/subjects", icon: "▤" },
  { label: "Timetable", href: "/student/timetable", icon: "▦" },
  { label: "Assignments", href: "/student/assignments", icon: "✎" },
  { label: "My Results", href: "/student/results", icon: "▥" },
  { label: "Attendance", href: "/student/attendance", icon: "✓" },
  { label: "School Fees", href: "/student/fees", icon: "₦" },
  { label: "Announcements", href: "/student/announcements", icon: "◈" },
  { label: "Notifications", href: "/student/notifications", icon: "♧" },
  { label: "Settings", href: "/student/settings", icon: "⚙" },
] as const;

type StudentPortalShellProps = {
  children: ReactNode;
  schoolName: string;
  logoUrl: string;
  userName: string;
  userEmail: string;
  userRole: string;
  signOutAction: () => Promise<void>;
};

export default function StudentPortalShell({
  children,
  schoolName,
  logoUrl,
  userName,
  userEmail,
  userRole,
  signOutAction,
}: StudentPortalShellProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 text-white md:flex">
        <div className="border-b border-slate-800 px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-600">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${schoolName} logo`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-lg font-bold">
                  {schoolName.charAt(0).toUpperCase() || "S"}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold tracking-tight">
                {schoolName}
              </h1>
              <p className="mt-1 text-xs text-slate-400">Student Portal</p>
            </div>
          </div>
        </div>

        <nav
          aria-label="Student navigation"
          className="flex-1 space-y-1 overflow-y-auto px-3 py-5"
        >
          {navigation.map(({ label, href, icon }) => {
            const active = isActive(href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span aria-hidden="true" className="w-5 text-center text-base">
                  {icon}
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="mb-4 rounded-lg bg-slate-800/70 p-3">
            <p className="truncate text-sm font-semibold">
              {userName || "Student"}
            </p>
            <p className="mt-1 truncate text-xs text-slate-400">
              {userEmail}
            </p>
            <span className="mt-2 inline-block rounded-full bg-blue-600/20 px-2.5 py-1 text-[11px] font-medium text-blue-300">
              {userRole}
            </span>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-3">
            <StudentMobileNavigation
              schoolName={schoolName}
              logoUrl={logoUrl}
            />

            <div className="min-w-0 md:hidden">
              <p className="max-w-[200px] truncate text-sm font-semibold text-slate-900">
                {schoolName}
              </p>
              <p className="text-xs text-slate-500">Student Portal</p>
            </div>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">
              {userName || "Student"}
            </p>
            <p className="text-xs text-slate-500">{userRole}</p>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
