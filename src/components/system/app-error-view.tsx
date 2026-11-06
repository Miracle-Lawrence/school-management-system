"use client";

import Link from "next/link";

type AppErrorViewProps = {
  code: string;
  title: string;
  description: string;
  actionLabel?: string;
  onRetry?: () => void;
  showDashboard?: boolean;
};

export default function AppErrorView({
  code,
  title,
  description,
  actionLabel = "Try again",
  onRetry,
  showDashboard = true,
}: AppErrorViewProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-5 py-12">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-100 text-blue-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-10 w-10"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.3 3.9 2.7 17.1a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>

        <p className="mt-8 text-sm font-extrabold uppercase tracking-[0.25em] text-blue-700">
          SchoolMS
        </p>

        <p className="mt-5 text-7xl font-black tracking-tight text-slate-200 sm:text-8xl">
          {code}
        </p>

        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
          {description}
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-xl bg-[#101b35] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-blue-900"
            >
              {actionLabel}
            </button>
          )}

          {showDashboard && (
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Go to dashboard
            </Link>
          )}

          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Back to homepage
          </Link>
        </div>

        <p className="mt-12 text-xs text-slate-400">
          SchoolMS · School Management System
        </p>
      </div>
    </main>
  );
}
