"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import SchoolMobileNavigation from "./school-mobile-navigation";

type SchoolPortalShellProps = {
  children: ReactNode;
  schoolName: string;
  logoUrl: string;
  userName: string;
  userEmail: string;
  userRole: string;
  signOutAction: () => Promise<void>;
};

export default function SchoolPortalShell({
  children,
  schoolName,
  logoUrl,
  userName,
  userEmail,
  userRole,
  signOutAction,
}: SchoolPortalShellProps) {
  const pathname = usePathname();

  const isReportCard = pathname === "/school/results/report-card";

  /*
   * The report card is a printable document.
   * It should not inherit the school portal navigation,
   * header, sidebar, or logged-in user information.
   */
  if (isReportCard) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col bg-slate-900 text-white md:flex">
        {/* School Branding */}
        <div className="border-b border-slate-800 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-600">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${schoolName} logo`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-lg font-bold">S</span>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight">
                {schoolName}
              </h1>

              <p className="mt-0.5 text-xs text-slate-400">
                School Administration
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-5">
          <Link
            href="/school/dashboard"
            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            Dashboard
          </Link>

          <Link
            href="/school/students"
            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            Students
          </Link>

          <Link
            href="/school/teachers"
            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            Teachers
          </Link>

          <Link
            href="/school/parents"
            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            Parents
          </Link>

          <Link
            href="/school/classes"
            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            Classes
          </Link>

          <Link
            href="/school/subjects"
            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            Subjects
          </Link>

          <Link
            href="/school/assessments"
            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            Assessments
          </Link>

          <Link
            href="/school/academic-sessions"
            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            Academic Sessions
          </Link>

          <Link
            href="/school/report-settings"
            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            Report Settings
          </Link>

          <Link
            href="/school/results"
            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            Results
          </Link>

          <div className="my-4 border-t border-slate-800" />

          <Link
            href="/school/settings"
            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            Settings
          </Link>
        </nav>

        {/* User Section */}
        <div className="border-t border-slate-800 p-4">
          <div className="mb-4 rounded-lg bg-slate-800/70 p-3">
            <p className="truncate text-sm font-semibold text-white">
              {userName || "School User"}
            </p>

            <p className="mt-1 truncate text-xs text-slate-400">{userEmail}</p>

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

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-3">
            <SchoolMobileNavigation schoolName={schoolName} logoUrl={logoUrl} />
          </div>

          {/* Logged-in User */}
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">
              {userName || "School User"}
            </p>

            <p className="text-xs text-slate-500">{userRole}</p>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
