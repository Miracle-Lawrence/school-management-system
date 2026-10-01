import Link from "next/link";
import { signOut } from "@/auth";
import { requireRole } from "@/lib/auth/authorization";

export default async function SchoolDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 flex-col bg-slate-900 text-white md:flex">
        <div className="border-b border-slate-800 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold">
              S
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight">
                SchoolMS
              </h1>

              <p className="mt-0.5 text-xs text-slate-400">
                School Administration
              </p>
            </div>
          </div>
        </div>

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
            href="/school/academic-sessions"
            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            Academic Sessions
          </Link>

          <div className="my-4 border-t border-slate-800" />

          <Link
            href="/school/settings"
            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            Settings
          </Link>
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="mb-4 rounded-lg bg-slate-800/70 p-3">
            <p className="truncate text-sm font-semibold text-white">
              {session.user.name ?? "School User"}
            </p>

            <p className="mt-1 truncate text-xs text-slate-400">
              {session.user.email}
            </p>

            <span className="mt-2 inline-block rounded-full bg-blue-600/20 px-2.5 py-1 text-[11px] font-medium text-blue-300">
              {session.user.role}
            </span>
          </div>

          <form
            action={async () => {
              "use server";

              await signOut({
                redirectTo: "/login",
              });
            }}
          >
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
        <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              School Dashboard
            </h2>

            <p className="hidden text-xs text-slate-500 sm:block">
              Manage your school from one place
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">
              {session.user.name ?? "School User"}
            </p>

            <p className="text-xs text-slate-500">{session.user.role}</p>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
