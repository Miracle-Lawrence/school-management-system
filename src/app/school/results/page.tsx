import Link from "next/link";
import { db } from "@/prisma/db";
import { requireRole } from "@/lib/auth/authorization";
import ResultPeriodSelector from "./result-period-selector";

export default async function ResultsPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const [academicSessions, classes] = await Promise.all([
    db.orm.public.AcademicSession.where((item) =>
      item.schoolId.eq(schoolId),
    ).all(),

    db.orm.public.SchoolClass.where((item) =>
      item.schoolId.eq(schoolId),
    ).all(),
  ]);

  const sortedSessions = [...academicSessions].sort((a, b) =>
    b.startDate.toString().localeCompare(a.startDate.toString()),
  );

  const sortedClasses = [...classes].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const termsBySession = await Promise.all(
    sortedSessions.map((academicSession) =>
      db.orm.public.Term.where((term) =>
        term.sessionId.eq(academicSession.id),
      ).all(),
    ),
  );

  const terms = termsBySession.flat().map((term) => ({
    id: term.id,
    sessionId: term.sessionId,
    name: term.name,
    isActive: term.isActive,
  }));

  const activeSession = sortedSessions.find((item) => item.isActive);

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Academic Management
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Results Management
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Manage student academic performance, calculate results, assign
          positions, and prepare student report cards.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Academic Sessions
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {academicSessions.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Sessions available for result management
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Classes</p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {classes.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Classes registered in your school
          </p>
        </div>
      </div>

      {/* Result selection */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Select Result Period
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Choose the academic period and class whose results you want to
            manage.
          </p>
        </div>

        <div className="mt-6">
          <ResultPeriodSelector
            academicSessions={sortedSessions.map((item) => ({
              id: item.id,
              name: item.name,
              isActive: item.isActive,
            }))}
            terms={terms}
            classes={sortedClasses.map((item) => ({
              id: item.id,
              name: item.name,
              level: item.level ?? null,
            }))}
          />
        </div>
      </section>

      {/* Subject Results Navigation */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                Subject Results
              </h2>

              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                Subject Management
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              View student scores by subject, review assessment components, and
              manage subject-level results for each class.
            </p>
          </div>

          <Link
            href="/school/results/subject"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Open Subject Results
            <span className="ml-2" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* Psychomotor Assessment Navigation */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                Psychomotor Assessment
              </h2>

              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Student Behaviour
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Record and manage student psychomotor and behavioural ratings for
              each academic term. Ratings are configured by your school and are
              separate from academic scores.
            </p>
          </div>

          <Link
            href="/school/results/psychomotor"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Open Psychomotor Assessment
            <span className="ml-2" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* Report Comments Navigation */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                Report Comments
              </h2>

              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                Teacher & Principal
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Enter and manage teacher and principal comments for individual
              students' terminal reports.
            </p>
          </div>

          <Link
            href="/school/results/report-card/comments"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700"
          >
            Manage Comments
            <span className="ml-2" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* Report Card Navigation */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                Terminal Report Card
              </h2>

              <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                Report Card
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              View student terminal report cards, including academic
              performance, psychomotor assessment, comments, grading, position,
              and school performance summaries.
            </p>
          </div>

          <Link
            href="/school/results/report-card"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700"
          >
            Open Report Card
            <span className="ml-2" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* Information */}
      <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
        <h2 className="text-sm font-semibold text-blue-900">
          About Results Management
        </h2>

        <p className="mt-2 text-sm leading-6 text-blue-800">
          Results will be calculated using your school's configured assessment
          components and grading scales. You will be able to review student
          scores before generating final results.
        </p>
      </section>

      <div>
        <Link
          href="/school/report-settings"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Configure report settings →
        </Link>
      </div>
    </div>
  );
}