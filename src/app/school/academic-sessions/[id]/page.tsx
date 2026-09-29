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
    <div className="space-y-8">
      <div>
        <Link
          href="/school/academic-sessions"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to Academic Sessions
        </Link>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{academicSession.name}</h1>

            <p className="mt-1 text-sm text-gray-500">
              Academic session details and terms
            </p>
          </div>

          <Link
            href={`/school/academic-sessions/${academicSession.id}/terms/new`}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Add Term
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-500">Start Date</p>

          <p className="mt-2 font-medium">
            {academicSession.startDate.toString().slice(0, 10)}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-500">End Date</p>

          <p className="mt-2 font-medium">
            {academicSession.endDate.toString().slice(0, 10)}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-500">Status</p>

          <div className="mt-2 flex items-center gap-3">
            {academicSession.isActive ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Active
              </span>
            ) : (
              <>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  Inactive
                </span>

                <form action={activateSessionAction}>
                  <button
                    type="submit"
                    className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
                  >
                    Activate
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Terms</h2>
        </div>

        {terms.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            No terms have been added to this academic session yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium">Term</th>

                  <th className="px-6 py-3 font-medium">Start Date</th>

                  <th className="px-6 py-3 font-medium">End Date</th>

                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {terms.map((term) => (
                  <tr key={term.id}>
                    <td className="px-6 py-4 font-medium">{term.name}</td>

                    <td className="px-6 py-4">
                      {term.startDate.toString().slice(0, 10)}
                    </td>

                    <td className="px-6 py-4">
                      {term.endDate.toString().slice(0, 10)}
                    </td>

                    <td className="px-6 py-4">
                      {term.isActive ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      ) : (
                        <form action={activateTermAction.bind(null, term.id)}>
                          <button
                            type="submit"
                            className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
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
      </div>
    </div>
  );
}
