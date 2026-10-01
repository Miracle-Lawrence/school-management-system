import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export default async function ParentsPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const parents = await db.orm.public.Parent.where((parent) =>
    parent.schoolId.eq(schoolId),
  ).all();

  const parentStudents = await db.orm.public.ParentStudent.all();

  const childrenCount = new Map<number, number>();

  for (const relationship of parentStudents) {
    const parent = parents.find(
      (parent) => parent.id === relationship.parentId,
    );

    if (!parent) {
      continue;
    }

    childrenCount.set(
      relationship.parentId,
      (childrenCount.get(relationship.parentId) ?? 0) + 1,
    );
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Family Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Parents
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Manage parents and guardians in your school.
          </p>
        </div>

        <Link
          href="/school/parents/new"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Add Parent
        </Link>
      </div>

      {/* Parent count */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-slate-600">Total parents</p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {parents.length}
        </p>
      </div>

      {/* Parents table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {parents.length === 0 ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-xl font-bold">P</span>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No parents yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Add your first parent or guardian to begin managing family
              records.
            </p>

            <Link
              href="/school/parents/new"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Add Parent
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Parent
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Email
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Phone
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Children
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Address
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {parents.map((parent) => {
                  const count = childrenCount.get(parent.id) ?? 0;

                  return (
                    <tr
                      key={parent.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/school/parents/${parent.id}`}
                          className="font-semibold text-slate-900 transition hover:text-blue-600"
                        >
                          {parent.firstName} {parent.lastName}
                        </Link>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {parent.email ?? "—"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {parent.phone ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {count}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {parent.address ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
