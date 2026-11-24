"use client";

import { signOut } from "next-auth/react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import SchoolMobileNavigation from "./school-mobile-navigation";
import SchoolNavigationMenu from "./school-navigation-menu";

type SchoolPortalShellProps = {
  children: ReactNode;
  schoolName: string;
  logoUrl: string;
  userName: string;
  userEmail: string;
  userRole: string;
};

export default function SchoolPortalShell({
  children,
  schoolName,
  logoUrl,
  userName,
  userEmail,
  userRole,
}: SchoolPortalShellProps) {
  async function handleSignOut() {
    await signOut({ redirect: false });
    window.location.assign("/login");
  }

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
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-64 flex-col bg-slate-900 text-white md:flex">
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
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <SchoolNavigationMenu />
        </div>
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

          <form onSubmit={(event) => { event.preventDefault(); void handleSignOut(); }}>
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
      <div className="flex min-w-0 flex-1 flex-col md:ml-64">
        {/* Top Header */}
        <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-3">
            <SchoolMobileNavigation schoolName={schoolName} logoUrl={logoUrl} onSignOut={() => void handleSignOut()} />
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
