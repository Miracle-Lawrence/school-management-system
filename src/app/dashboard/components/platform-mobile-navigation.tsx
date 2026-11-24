"use client";

import { useState } from "react";
import Link from "next/link";
import EnquiryNavLink from "@/app/dashboard/components/enquiry-nav-link";
import PlatformNavigationMenu from "@/app/dashboard/components/platform-navigation-menu";

type PlatformMobileNavigationProps = {
  name: string;
  email: string;
  role: string;
  signOutAction: (formData: FormData) => Promise<void>;
};

export default function PlatformMobileNavigation({
  name,
  email,
  role,
  signOutAction,
}: PlatformMobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-[#101b35] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-lg font-bold">
                  S
                </div>
                <div>
                  <p className="font-bold">SchoolMS</p>
                  <p className="text-xs text-slate-400">Platform Administration</p>
                </div>
              </Link>

              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Workspace
              </p>
              <p className="mt-1 text-sm font-semibold">Platform Console</p>
            </div>

            <nav
              aria-label="Mobile platform navigation"
              className="flex-1 overflow-y-auto px-4 py-6"
            >
              <PlatformNavigationMenu onNavigate={() => setIsOpen(false)} />

              <div className="mt-4">
                <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Communications
                </p>
                <EnquiryNavLink
                  mobile
                  onNavigate={() => setIsOpen(false)}
                />
              </div>
            </nav>

            <div className="border-t border-white/10 p-4">
              <div className="mb-4 flex min-w-0 items-center gap-3 rounded-xl bg-white/5 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-200">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  <p className="truncate text-xs text-slate-400">{email}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                    {role.replaceAll("_", " ")}
                  </p>
                </div>
              </div>

              <form action={signOutAction}>
                <button
                  type="submit"
                  className="w-full rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
