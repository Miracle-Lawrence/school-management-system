import Link from "next/link";
import { signOut } from "@/auth";
import { requireRole } from "@/lib/auth/authorization";

const navigation = [
  {
    label: "Overview",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: "◫",
      },
    ],
  },
  {
    label: "School Management",
    items: [
      {
        name: "Schools",
        href: "/dashboard/schools",
        icon: "▤",
      },
      {
        name: "Users",
        href: "/dashboard/users",
        icon: "♙",
      },
    ],
  },
  {
    label: "Billing & Subscriptions",
    items: [
      {
        name: "Subscription Plans",
        href: "/dashboard/subscriptions",
        icon: "◇",
      },
      {
        name: "School Subscriptions",
        href: "/dashboard/subscriptions/schools",
        icon: "▦",
      },
      {
        name: "Payment Records",
        href: "/dashboard/subscriptions/payments",
        icon: "₦",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        name: "Settings",
        href: "/dashboard/settings",
        icon: "⚙",
      },
    ],
  },
];

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 flex-col bg-[#101b35] text-white md:flex">
          <div className="border-b border-white/10 px-6 py-7">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-xl font-bold shadow-lg shadow-blue-950/30">
                S
              </div>

              <div>
                <h1 className="text-lg font-bold tracking-tight">SchoolMS</h1>
                <p className="mt-0.5 text-xs text-slate-400">
                  Platform Administration
                </p>
              </div>
            </Link>
          </div>

          <div className="px-6 py-5">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Workspace
              </p>
              <p className="mt-1.5 text-sm font-semibold">Platform Console</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-400">Administration</span>
              </div>
            </div>
          </div>

          <nav
            aria-label="Platform navigation"
            className="flex-1 space-y-7 overflow-y-auto px-4 pb-6"
          >
            {navigation.map((section) => (
              <div key={section.label}>
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  {section.label}
                </p>

                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-base text-slate-400 transition-colors group-hover:bg-blue-500/20 group-hover:text-blue-300"
                      >
                        {item.icon}
                      </span>

                      <span>{item.name}</span>

                      <span className="ml-auto text-slate-600 opacity-0 transition-opacity group-hover:opacity-100">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="mb-4 flex min-w-0 items-center gap-3 rounded-xl bg-white/5 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-200">
                {(session.user.name ?? "P").charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {session.user.name ?? "Platform Owner"}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {session.user.email}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                  {session.user.role.replaceAll("_", " ")}
                </p>
              </div>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
              >
                <span aria-hidden="true">↗</span>
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex min-h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                SchoolMS / Administration
              </p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                Platform Dashboard
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {session.user.name ?? "Platform Owner"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {session.user.role.replaceAll("_", " ")}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 ring-1 ring-slate-200">
                {(session.user.name ?? "P").charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          <main className="w-full flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

          <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500">
            SchoolMS Platform Administration
          </footer>
        </div>
      </div>
    </div>
  );
}
