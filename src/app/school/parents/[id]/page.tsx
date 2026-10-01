import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { updateParent } from "@/lib/services/parent.service";

type ParentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const updateParentSchema = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(250).optional().or(z.literal("")),
});

export default async function ParentDetailsPage({ params }: ParentPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const parentId = Number(id);

  if (!Number.isInteger(parentId)) {
    notFound();
  }

  const parent = await db.orm.public.Parent.where((parent) =>
    parent.id.eq(parentId),
  ).first();

  if (!parent || parent.schoolId !== schoolId) {
    notFound();
  }

  const links = await db.orm.public.ParentStudent.where((link) =>
    link.parentId.eq(parentId),
  ).all();

  const students = await db.orm.public.Student.where((student) =>
    student.schoolId.eq(schoolId),
  ).all();

  const studentMap = new Map(students.map((student) => [student.id, student]));

  const children = links
    .map((link) => studentMap.get(link.studentId))
    .filter((student) => student !== undefined);

  async function updateParentAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const result = updateParentSchema.safeParse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      address: formData.get("address"),
    });

    if (!result.success) {
      throw new Error(
        result.error.issues[0]?.message || "Invalid parent information.",
      );
    }

    await updateParent(schoolId, parentId, result.data);

    redirect(`/school/parents/${parentId}`);
  }

  const fullName = `${parent.firstName} ${parent.lastName}`;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-2 sm:px-4">
      {/* Back navigation */}
      <div>
        <Link
          href="/school/parents"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Parents
        </Link>
      </div>

      {/* Parent profile header */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-blue-700">
              {parent.firstName.charAt(0)}
              {parent.lastName.charAt(0)}
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-600">
                Parent Profile
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {fullName}
              </h1>

              <p className="mt-1 text-sm text-slate-600">Parent / Guardian</p>
            </div>
          </div>

          <Link
            href={`/school/parents/${parent.id}/children`}
            className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Manage Children
          </Link>
        </div>
      </section>

      {/* Parent information and children */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact information */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-900">
              Contact Information
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Personal and communication details.
            </p>
          </div>

          <dl className="space-y-5 px-6 py-6">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email Address
              </dt>

              <dd className="mt-1 break-words text-sm font-medium text-slate-900">
                {parent.email ?? "Not provided"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone Number
              </dt>

              <dd className="mt-1 text-sm font-medium text-slate-900">
                {parent.phone ?? "Not provided"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Residential Address
              </dt>

              <dd className="mt-1 text-sm leading-6 text-slate-900">
                {parent.address ?? "Not provided"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Children */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="font-semibold text-slate-900">Children</h2>

              <p className="mt-1 text-sm text-slate-600">
                Students linked to this parent.
              </p>
            </div>

            <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {children.length}
            </span>
          </div>

          <div className="space-y-3 p-6">
            {children.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <span className="text-xl font-bold">S</span>
                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
                  No children linked yet
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Link students to this parent to manage their family records.
                </p>

                <Link
                  href={`/school/parents/${parent.id}/children`}
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Link a Student
                </Link>
              </div>
            ) : (
              children.map((student) => (
                <div
                  key={student.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {student.firstName.charAt(0)}
                      {student.lastName.charAt(0)}
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">
                        {student.firstName}{" "}
                        {student.middleName ? `${student.middleName} ` : ""}
                        {student.lastName}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        Admission No: {student.admissionNumber}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/school/students/${student.id}`}
                    className="inline-flex w-fit items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    View Student
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Edit parent information */}
      <details className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-6 py-5 font-semibold text-slate-900 transition hover:bg-slate-50 sm:px-8">
          Edit Parent Information
          <p className="mt-1 text-sm font-normal text-slate-600">
            Update the parent's name and contact details.
          </p>
        </summary>

        <form
          action={updateParentAction}
          className="space-y-6 border-t border-slate-200 p-6 sm:p-8"
        >
          <section>
            <h2 className="mb-5 text-base font-semibold text-slate-900">
              Basic Information
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  First Name
                </label>

                <input
                  id="firstName"
                  name="firstName"
                  defaultValue={parent.firstName}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Last Name
                </label>

                <input
                  id="lastName"
                  name="lastName"
                  defaultValue={parent.lastName}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h2 className="mb-5 text-base font-semibold text-slate-900">
              Contact Information
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={parent.email ?? ""}
                  placeholder="parent@example.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Phone
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={parent.phone ?? ""}
                  placeholder="08012345678"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Residential Address
              </label>

              <textarea
                id="address"
                name="address"
                defaultValue={parent.address ?? ""}
                rows={4}
                placeholder="Parent's residential address"
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </section>

          <div className="flex justify-end border-t border-slate-200 pt-6">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}
