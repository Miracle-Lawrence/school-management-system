"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

type TeacherPortalShellProps = {
  children: ReactNode;
  schoolName: string;
  logoUrl: string;
  userName: string;
  userEmail: string;
  userRole: string;
  signOutAction: () => Promise<void>;
};

const navigation = [
  { label: "Dashboard", href: "/teacher/dashboard" },
  { label: "My Classes", href: "/teacher/classes" },
  { label: "Attendance", href: "/teacher/attendance" },
  { label: "Assessments", href: "/teacher/assessments" },
  { label: "My Profile", href: "/teacher/profile" },
  {
    label: "Gradebook",
    href: "/teacher/gradebook",
  },
];

export default function TeacherPortalShell({
  children,
  schoolName,
  logoUrl,
  userName,
  userEmail,
  userRole,
  signOutAction,
}: TeacherPortalShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function navigationLinkClass(href: string) {
    const active =
      pathname === href ||
      (href !== "/teacher/dashboard" && pathname.startsWith(`${href}/`));

    return `block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
      active
        ? "bg-blue-600 text-white"
        : "text-slate-200 hover:bg-slate-800 hover:text-white"
    }`;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 text-white md:flex">
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
              <p className="mt-0.5 text-xs text-slate-400">Teacher Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={navigationLinkClass(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="mb-4 rounded-lg bg-slate-800/70 p-3">
            <p className="truncate text-sm font-semibold text-white">
              {userName || "Teacher"}
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

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={
                mobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
            >
              {mobileMenuOpen ? (
                <span className="text-xl">×</span>
              ) : (
                <span className="text-xl">☰</span>
              )}
            </button>

            <div className="flex items-center gap-2 md:hidden">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-blue-600 text-sm font-bold text-white">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${schoolName} logo`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  "S"
                )}
              </div>
              <span className="max-w-[180px] truncate text-sm font-semibold text-slate-900">
                {schoolName}
              </span>
            </div>

            <span className="hidden text-sm font-semibold text-slate-700 md:block">
              Teacher Portal
            </span>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">
              {userName || "Teacher"}
            </p>
            <p className="text-xs text-slate-500">{userRole}</p>
          </div>
        </header>

        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/50"
            />

            <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-slate-900 text-white shadow-xl">
              <div className="border-b border-slate-800 px-6 py-6">
                <h2 className="truncate text-lg font-bold">{schoolName}</h2>
                <p className="mt-1 text-xs text-slate-400">Teacher Portal</p>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={navigationLinkClass(item.href)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="border-t border-slate-800 p-4">
                <p className="truncate text-sm font-semibold">
                  {userName || "Teacher"}
                </p>
                <p className="mt-1 truncate text-xs text-slate-400">
                  {userEmail}
                </p>
                <form action={signOutAction} className="mt-4">
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </aside>
          </div>
        ) : null}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
