import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";

export default async function StudentSettingsPage() {
  const session = await requireRole(["STUDENT"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (!Number.isSafeInteger(userId) || userId <= 0 || !schoolId) {
    redirect("/login");
  }

  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user || !user.isActive) {
    redirect("/login");
  }

  if (user.mustChangePassword) {
    redirect("/student/change-password");
  }

  const student = await db.orm.public.Student.where({
    userId,
  }).first();

  if (!student || student.schoolId !== schoolId || !student.isActive) {
    return (
      <main className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm leading-6 text-amber-900">
            Your student profile is not linked correctly. Please contact your
            school administrator for assistance.
          </p>
        </section>
      </main>
    );
  }

  const accountName =
    [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(" ") ||
    user.name ||
    "Student";

  const accountEmail = user.email;

  const settingsLinks = [
    {
      title: "My profile",
      description:
        "View your personal information, admission number, class, and other student details.",
      href: "/student/profile",
      action: "View profile",
    },
    {
      title: "Notifications",
      description:
        "Review school announcements, reminders, and other messages sent to your account.",
      href: "/student/notifications",
      action: "View notifications",
    },
  ];

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-blue-600">Student portal</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          View your account information and access important account options.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
            {accountName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">
              Account information
            </h2>
            <p className="text-sm text-slate-500">
              Your account details as registered by your school.
            </p>
          </div>
        </div>

        <dl className="mt-6 divide-y divide-slate-100">
          <div className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-slate-500">Full name</dt>
            <dd className="text-sm font-medium text-slate-900 sm:col-span-2">
              {accountName}
            </dd>
          </div>

          <div className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-slate-500">
              Account email
            </dt>
            <dd className="break-words text-sm text-slate-900 sm:col-span-2">
              {accountEmail}
            </dd>
          </div>

          <div className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-slate-500">Admission number</dt>
            <dd className="text-sm text-slate-900 sm:col-span-2">
              {student.admissionNumber}
            </dd>
          </div>

          <div className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-slate-500">Account role</dt>
            <dd className="text-sm text-slate-900 sm:col-span-2">
              Student
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Account options
        </h2>

        {settingsLinks.map((item) => (
          <article
            key={item.href}
            className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </div>

            <Link
              href={item.href}
              className="inline-flex w-fit shrink-0 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {item.action}
            </Link>
          </article>
        ))}

        <article className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Change password</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Keep your account secure by using a strong password and never
              sharing your login details with others.
            </p>
          </div>

          <Link
            href="/student/change-password"
            className="inline-flex w-fit shrink-0 items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Change password
          </Link>
        </article>
      </section>

      <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        Need to correct your name, admission number, or other registered
        information? Contact your school administrator. These details are
        managed by the school.
      </p>
    </main>
  );
}
