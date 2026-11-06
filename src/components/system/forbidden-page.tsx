import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-5 py-12">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 text-red-700">
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
            <circle cx="12" cy="12" r="9" />
            <path d="M15 9 9 15" />
            <path d="m9 9 6 6" />
          </svg>
        </div>

        <p className="mt-8 text-sm font-extrabold uppercase tracking-[0.25em] text-red-700">
          SchoolMS
        </p>

        <p className="mt-5 text-7xl font-black tracking-tight text-slate-200 sm:text-8xl">
          403
        </p>

        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Access denied
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
          You do not have permission to access this page or resource. If you
          believe this is a mistake, please contact your school administrator.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-xl bg-[#101b35] px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-900"
          >
            Sign in with another account
          </Link>

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
