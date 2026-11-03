import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

type SearchParams = {
  sessionId?: string;
  termId?: string;
  classId?: string;
};

function parsePositiveId(value?: string) {
  if (!value || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

export default async function PsychomotorResultsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    redirect("/login");
  }

  const params = await searchParams;

  const requestedSessionId = parsePositiveId(params.sessionId);
  const requestedTermId = parsePositiveId(params.termId);
  const requestedClassId = parsePositiveId(params.classId);

  const [sessions, classes] = await Promise.all([
    db.orm.public.AcademicSession.where((item) =>
      item.schoolId.eq(schoolId),
    ).all(),

    db.orm.public.SchoolClass.where((item) => item.schoolId.eq(schoolId)).all(),
  ]);

  const sortedSessions = [...sessions].sort(
    (a, b) => Date.parse(String(b.startDate)) - Date.parse(String(a.startDate)),
  );

  const sortedClasses = [...classes].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const activeSession =
    sortedSessions.find((item) => item.isActive) ?? sortedSessions[0] ?? null;

  const selectedSession =
    sortedSessions.find((item) => item.id === requestedSessionId) ??
    activeSession;

  const terms = selectedSession
    ? await db.orm.public.Term.where((item) =>
        item.sessionId.eq(selectedSession.id),
      ).all()
    : [];

  const selectedTerm =
    terms.find((item) => item.id === requestedTermId) ??
    terms.find((item) => item.isActive) ??
    terms[0] ??
    null;

  const selectedClass =
    sortedClasses.find((item) => item.id === requestedClassId) ?? null;

  let students = selectedClass
    ? await db.orm.public.Student.where((item) =>
        item.classId.eq(selectedClass.id),
      ).all()
    : [];

  students = students
    .filter((student) => student.schoolId === schoolId)
    .sort((a, b) => {
      const nameA = `${a.lastName} ${a.firstName} ${a.middleName ?? ""}`;

      const nameB = `${b.lastName} ${b.firstName} ${b.middleName ?? ""}`;

      return nameA.localeCompare(nameB);
    });

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-2 py-6 sm:px-4">
      {/* Heading */}
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Student Assessment
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Psychomotor & Behaviour
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Select an academic period and class to enter or review student
          psychomotor and behavioural ratings.
        </p>
      </div>

      {/* Selection */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="font-semibold text-slate-900">
            Select Assessment Period
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Choose the session, term, and class you want to assess.
          </p>
        </div>

        <form method="GET" className="mt-6 grid gap-5 sm:grid-cols-3">
          <div>
            <label
              htmlFor="sessionId"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Academic Session
            </label>

            <select
              id="sessionId"
              name="sessionId"
              defaultValue={selectedSession?.id ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select session</option>

              {sortedSessions.map((academicSession) => (
                <option key={academicSession.id} value={academicSession.id}>
                  {academicSession.name}
                  {academicSession.isActive ? " — Active" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="termId"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Term
            </label>

            <select
              id="termId"
              name="termId"
              defaultValue={selectedTerm?.id ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select term</option>

              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                  {term.isActive ? " — Active" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="classId"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Class
            </label>

            <select
              id="classId"
              name="classId"
              defaultValue={selectedClass?.id ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select class</option>

              {sortedClasses.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              View Students
            </button>
          </div>
        </form>
      </section>

      {/* Students */}
      {selectedClass && selectedTerm ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
            <h2 className="font-semibold text-slate-900">
              {selectedClass.name}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {selectedTerm.name} · {selectedSession?.name}
            </p>
          </div>

          {students.length === 0 ? (
            <div className="px-6 py-10 text-center sm:px-8">
              <p className="font-medium text-slate-900">No students found</p>

              <p className="mt-1 text-sm text-slate-500">
                There are no students assigned to this class.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      #
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Student
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Admission No.
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {students.map((student, index) => (
                    <tr key={student.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                        {index + 1}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                        {student.lastName} {student.firstName}{" "}
                        {student.middleName ?? ""}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {student.admissionNumber}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <Link
                          href={`/school/results/psychomotor/${student.id}?termId=${selectedTerm.id}&classId=${selectedClass.id}`}
                          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          Enter Ratings
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="text-sm font-semibold text-blue-900">
            Select an assessment period
          </h2>

          <p className="mt-2 text-sm leading-6 text-blue-800">
            Choose a session, term, and class above to see the students
            available for psychomotor and behavioural assessment.
          </p>
        </section>
      )}

      {/* Settings link */}
      <div>
        <Link
          href="/school/settings/psychomotor"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Configure Psychomotor & Behaviour settings →
        </Link>
      </div>
    </main>
  );
}
