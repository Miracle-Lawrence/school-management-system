import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { activateAcademicSession } from "@/lib/services/academic-session-activation.service";
import { activateTerm } from "@/lib/services/term-activation.service";

type AcademicSessionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AcademicSessionPage({
  params,
}: AcademicSessionPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const sessionId = Number(id);

  if (!Number.isInteger(sessionId)) {
    notFound();
  }

  const academicSession = await db.orm.public.AcademicSession.where(
    (academicSession) => academicSession.id.eq(sessionId),
  ).first();

  if (!academicSession || academicSession.schoolId !== schoolId) {
    notFound();
  }

  async function activateSessionAction() {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    await activateAcademicSession(schoolId, sessionId);

    redirect(`/school/academic-sessions/${sessionId}`);
  }

  async function activateTermAction(termId: number) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    await activateTerm(schoolId, termId);

    redirect(`/school/academic-sessions/${sessionId}`);
  }

  const terms = await db.orm.public.Term.where((term) =>
    term.sessionId.eq(academicSession.id),
  ).all();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-2 sm:px-4">
      {/* Header */}
      <div>
        <Link
          href="/school/academic-sessions"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Academic Sessions
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Academic Management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {academicSession.name}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage this academic session, its status, and academic terms.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/school/academic-sessions/${academicSession.id}/edit`}
              className="inline-flex w-fit items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Edit Session
            </Link>

            <Link
              href={`/school/academic-sessions/${academicSession.id}/terms/new`}
              className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              + Add Term
            </Link>
          </div>
        </div>
      </div>

      {/* Session overview */}
      <section className="grid gap-4 sm:grid-cols-3">
        {/* Start date */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Start Date
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {academicSession.startDate.toString().slice(0, 10)}
          </p>
        </div>

        {/* End date */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            End Date
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {academicSession.endDate.toString().slice(0, 10)}
          </p>
        </div>

        {/* Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Session Status
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {academicSession.isActive ? (
              <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Active
              </span>
            ) : (
              <>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Inactive
                </span>

                <form action={activateSessionAction}>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Activate Session
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Terms */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <h2 className="font-semibold text-slate-900">Academic Terms</h2>

            <p className="mt-1 text-sm text-slate-600">
              Manage the terms within this academic session.
            </p>
          </div>

          <span className="inline-flex w-fit min-w-8 items-center justify-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            {terms.length}
          </span>
        </div>

        {terms.length === 0 ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-xl font-bold">T</span>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No terms yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Add the first academic term to begin managing this session's
              academic calendar.
            </p>

            <Link
              href={`/school/academic-sessions/${academicSession.id}/terms/new`}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Add Term
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Term
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Start Date
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    End Date
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {terms.map((term) => (
                  <tr key={term.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {term.name}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {term.startDate.toString().slice(0, 10)}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {term.endDate.toString().slice(0, 10)}
                    </td>

                    <td className="px-6 py-4">
                      {term.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Active
                        </span>
                      ) : (
                        <form action={activateTermAction.bind(null, term.id)}>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                          >
                            Activate
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
