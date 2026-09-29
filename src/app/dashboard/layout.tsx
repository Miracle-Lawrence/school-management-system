import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="hidden w-64 flex-col border-r bg-white md:flex">
        <div className="border-b p-6">
          <h1 className="text-xl font-bold">SchoolMS</h1>
          <p className="mt-1 text-xs text-gray-500">Platform Administration</p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <Link
            href="/dashboard"
            className="block rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Dashboard
          </Link>

          <Link
            href="/dashboard/schools"
            className="block rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Schools
          </Link>

          <Link
            href="/dashboard/users"
            className="block rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Users
          </Link>

          <Link
            href="/dashboard/subscriptions"
            className="block rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Subscriptions
          </Link>

          <Link
            href="/dashboard/settings"
            className="block rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Settings
          </Link>
        </nav>

        <div className="border-t p-4">
          <div className="mb-3">
            <p className="truncate text-sm font-medium">
              {session.user.name ?? "Platform Owner"}
            </p>

            <p className="truncate text-xs text-gray-500">
              {session.user.email}
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <div>
            <h2 className="text-lg font-semibold">Platform Dashboard</h2>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium">
              {session.user.name ?? "Platform Owner"}
            </p>

            <p className="text-xs text-gray-500">{session.user.role}</p>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
