"use client";




import ParentNavigationMenu from "./parent-navigation-menu";
import { useState } from "react";


type ParentMobileNavigationProps = {
  schoolName: string;
  logoUrl: string;
  onSignOut: () => void;
};

export default function ParentMobileNavigation({
  schoolName,
  logoUrl,
  onSignOut,
}: ParentMobileNavigationProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
      >
        <span className="sr-only">Menu</span>

        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/50"
          />

          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-slate-900 text-white shadow-xl">
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
                  <p className="mt-0.5 text-xs text-slate-400">Parent Portal</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-5">
              <ParentNavigationMenu
                compact
                onNavigate={() => setOpen(false)}
              />
            </div>

            <div className="shrink-0 border-t border-slate-800 p-4">
              <button
                type="button"
                onClick={onSignOut}
                className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
              >
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
