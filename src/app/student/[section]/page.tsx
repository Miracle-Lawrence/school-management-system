import Link from "next/link";
import { notFound } from "next/navigation";

const sections: Record<string, { title: string; description: string }> = {
  profile: {
    title: "My Profile",
    description: "View your personal information and admission details.",
  },
  subjects: {
    title: "My Class & Subjects",
    description: "View your assigned class and subjects.",
  },
  timetable: {
    title: "Timetable",
    description: "Check your class timetable and lesson schedule.",
  },
  assignments: {
    title: "Assignments",
    description: "View assignments and keep track of your schoolwork.",
  },
  results: {
    title: "My Results",
    description: "View your available academic results.",
  },
  attendance: {
    title: "Attendance",
    description: "Review your attendance records.",
  },
  fees: {
    title: "School Fees",
    description: "View your school fee invoices and payment information.",
  },
  announcements: {
    title: "Announcements",
    description: "Read announcements published by your school.",
  },
  notifications: {
    title: "Notifications",
    description: "Review notifications sent to your account.",
  },
  settings: {
    title: "Settings",
    description: "Manage the settings available for your student account.",
  },
};

type StudentSectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function StudentSectionPage({
  params,
}: StudentSectionPageProps) {
  const { section } = await params;
  const page = sections[section];

  if (!page) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-blue-600">Student portal</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {page.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {page.description}
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-700">
          ◈
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          {page.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          This section is now part of your student portal. The next step is to
          connect it to the appropriate student records and actions.
        </p>
        <Link
          href="/student/dashboard"
          className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Back to dashboard
        </Link>
      </section>
    </div>
  );
}
