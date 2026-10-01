import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

type ClassSubjectsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClassSubjectsPage({
  params,
}: ClassSubjectsPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const classId = Number(id);

  if (!Number.isInteger(classId)) {
    notFound();
  }

  const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    notFound();
  }

  const assignments = await db.orm.public.ClassSubject.where((assignment) =>
    assignment.classId.eq(classId),
  ).all();

  const subjects = await db.orm.public.Subject.where((subject) =>
    subject.schoolId.eq(schoolId),
  ).all();

  const assignedSubjectIds = new Set(
    assignments.map((assignment) => assignment.subjectId),
  );

  const assignedSubjects = assignments
    .map((assignment) => {
      const subject = subjects.find(
        (subject) => subject.id === assignment.subjectId,
      );

      return {
        assignment,
        subject,
      };
    })
    .filter((item) => item.subject);

  const availableSubjects = subjects.filter(
    (subject) => !assignedSubjectIds.has(subject.id),
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-2 sm:px-4">
      {/* Page heading */}
      <div>
        <Link
          href={`/school/classes/${classId}`}
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to {schoolClass.name}
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Class Management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {schoolClass.name} Subjects
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage the subjects assigned to this class.
            </p>
          </div>

          <Link
            href={`/school/classes/${classId}/subjects/new`}
            className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Assign Subject
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Assigned Subjects
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {assignedSubjects.length}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Subjects currently offered by this class
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Available Subjects
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {availableSubjects.length}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            School subjects not yet assigned to this class
          </p>
        </div>
      </div>

      {/* Assigned subjects */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Assigned Subjects
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Subjects currently assigned to {schoolClass.name}.
              </p>
            </div>

            <span className="inline-flex w-fit min-w-8 items-center justify-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {assignedSubjects.length}
            </span>
          </div>
        </div>

        {assignedSubjects.length === 0 ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-xl font-bold">S</span>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No subjects assigned
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Assign subjects to this class to begin organizing its curriculum.
            </p>

            <Link
              href={`/school/classes/${classId}/subjects/new`}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Assign Subject
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Subject
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Code
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {assignedSubjects.map(({ assignment, subject }) => (
                  <tr
                    key={assignment.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/school/subjects/${subject?.id}`}
                        className="font-semibold text-slate-900 transition hover:text-blue-600"
                      >
                        {subject?.name}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      {subject?.code ? (
                        <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {subject.code}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Available subjects */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Available Subjects
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Subjects offered by the school that are not yet assigned to this
                class.
              </p>
            </div>

            <span className="inline-flex w-fit min-w-8 items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {availableSubjects.length}
            </span>
          </div>
        </div>

        {availableSubjects.length === 0 ? (
          <div className="px-6 py-10 text-center sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-700">
              <span className="text-xl font-bold">✓</span>
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              All subjects assigned
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Every subject currently available at the school has been assigned
              to this class.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
            {availableSubjects.map((subject) => (
              <div
                key={subject.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {subject.name}
                    </p>

                    {subject.code ? (
                      <span className="mt-2 inline-flex rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {subject.code}
                      </span>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">
                        No subject code
                      </p>
                    )}
                  </div>

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600">
                    {subject.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
