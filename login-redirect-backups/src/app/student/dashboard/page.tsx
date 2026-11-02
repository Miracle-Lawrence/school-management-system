import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

const quickLinks = [
  {
    title: "My Profile",
    description: "View your personal and admission details.",
    href: "/student/profile",
  },
  {
    title: "My Class & Subjects",
    description: "See your class and registered subjects.",
    href: "/student/subjects",
  },
  {
    title: "Timetable",
    description: "Check your school timetable.",
    href: "/student/timetable",
  },
  {
    title: "Assignments",
    description: "Keep track of your learning tasks.",
    href: "/student/assignments",
  },
  {
    title: "My Results",
    description: "Review your published academic results.",
    href: "/student/results",
  },
  {
    title: "Attendance",
    description: "Review your attendance records.",
    href: "/student/attendance",
  },
  {
    title: "School Fees",
    description: "View your school fee invoices.",
    href: "/student/fees",
  },
  {
    title: "Announcements",
    description: "Read important messages from your school.",
    href: "/student/announcements",
  },
] as const;

export default async function StudentDashboardPage() {
  const session = await requireRole(["STUDENT"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (!Number.isInteger(userId) || !schoolId) {
    redirect("/login");
  }

  const user = await db.orm.public.User.where((item) =>
    item.id.eq(userId),
  ).first();

  if (!user || !user.isActive) {
    redirect("/login");
  }

  if (user.mustChangePassword) {
    redirect("/student/change-password");
  }

  const student = await db.orm.public.Student.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!student || student.schoolId !== schoolId || !student.isActive) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold text-blue-600">Student portal</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Welcome
        </h1>

        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">
            Your student profile is not linked yet
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Your login is not currently linked to an active student record at
            your school. Please contact your school administrator to complete
            the setup.
          </p>
        </section>
      </div>
    );
  }

  const fullName = [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const schoolClass = student.classId
    ? await db.orm.public.SchoolClass.where((item) =>
        item.id.eq(student.classId!),
      ).first()
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-medium text-blue-100">Student dashboard</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome, {student.firstName}!
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
          Your school information, academic records, and important updates in
          one place.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-lg bg-white/15 px-3 py-2">
            Admission No.: {student.admissionNumber}
          </span>
          <span className="rounded-lg bg-white/15 px-3 py-2">
            Class: {schoolClass?.name ?? "Not assigned"}
          </span>
        </div>
      </header>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Quick access</h2>
          <p className="mt-1 text-sm text-slate-600">
            Open the student services you need.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-blue-700">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-5 text-slate-600">
                {item.description}
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-blue-700">
                Open section →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="font-bold text-slate-900">Student information</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-sm text-slate-500">Full name</dt>
            <dd className="mt-1 font-medium text-slate-900">{fullName}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Admission number</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {student.admissionNumber}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Class</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {schoolClass?.name ?? "Not assigned"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Email</dt>
            <dd className="mt-1 break-words font-medium text-slate-900">
              {student.email || session.user.email || "Not provided"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Phone</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {student.phone || "Not provided"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Account status</dt>
            <dd className="mt-1 font-medium text-emerald-700">Active</dd>
          </div>
        </dl>

        <Link
          href="/student/profile"
          className="mt-5 inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          View full profile
        </Link>
      </section>
    </div>
  );
}

