import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/authorization";
import { updateTeacher } from "@/lib/services/teacher.service";
import { db } from "@/prisma/db";

type TeacherDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const updateTeacherSchema = z.object({
  employeeId: z.string().trim().min(1).max(50),
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .optional()
    .or(z.literal("")),
});

export default async function TeacherDetailsPage({
  params,
}: TeacherDetailsPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const teacherId = Number(id);

  if (!Number.isInteger(teacherId)) {
    notFound();
  }

  const teacher = await db.orm.public.Teacher.where((teacher) =>
    teacher.id.eq(teacherId),
  ).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    notFound();
  }

  const assignments = await db.orm.public.TeacherAssignment.where(
    (assignment) => assignment.teacherId.eq(teacherId),
  ).all();

  const classes = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.schoolId.eq(schoolId),
  ).all();

  const subjects = await db.orm.public.Subject.where((subject) =>
    subject.schoolId.eq(schoolId),
  ).all();

  const classMap = new Map(
    classes.map((schoolClass) => [schoolClass.id, schoolClass.name]),
  );

  const subjectMap = new Map(
    subjects.map((subject) => [subject.id, subject.name]),
  );

  async function updateTeacherAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const result = updateTeacherSchema.safeParse({
      employeeId: formData.get("employeeId"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      phone: formData.get("phone"),
      email: formData.get("email"),
    });

    if (!result.success) {
      throw new Error(
        result.error.issues[0]?.message || "Invalid teacher information.",
      );
    }

    await updateTeacher(schoolId, teacherId, result.data);

    redirect(`/school/teachers/${teacherId}`);
  }

  const fullName = `${teacher.firstName} ${teacher.lastName}`;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-2 sm:px-4">
      {/* Header */}
      <div>
        <Link
          href="/school/teachers"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Teachers
        </Link>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-600">
                {teacher.firstName.charAt(0)}
                {teacher.lastName.charAt(0)}
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-600">
                  Teacher Profile
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {fullName}
                </h1>

                <p className="mt-1 text-sm text-slate-600">
                  Employee ID{" "}
                  <span className="font-semibold text-slate-800">
                    {teacher.employeeId}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Information and assignments */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-900">
              Teacher Information
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Personal and contact information.
            </p>
          </div>

          <dl className="grid gap-5 px-6 py-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Employee ID
              </dt>

              <dd className="mt-1 font-medium text-slate-900">
                {teacher.employeeId}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                First Name
              </dt>

              <dd className="mt-1 font-medium text-slate-900">
                {teacher.firstName}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Last Name
              </dt>

              <dd className="mt-1 font-medium text-slate-900">
                {teacher.lastName}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </dt>

              <dd className="mt-1 text-slate-700">{teacher.email ?? "—"}</dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone
              </dt>

              <dd className="mt-1 text-slate-700">{teacher.phone ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-900">
              Teaching Assignments
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Classes and subjects assigned to this teacher.
            </p>
          </div>

          <div className="px-6 py-6">
            {assignments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                <p className="font-medium text-slate-800">
                  No teaching assignments yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Assign this teacher to classes and subjects to see them here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      {classMap.get(assignment.classId) ?? "Unknown Class"}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Subject:{" "}
                      <span className="font-medium text-slate-800">
                        {subjectMap.get(assignment.subjectId) ??
                          "Unknown Subject"}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Edit section */}
      <details className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-6 py-5 font-semibold text-slate-900 transition hover:bg-slate-50 sm:px-8">
          Edit Teacher Information
        </summary>

        <form
          action={updateTeacherAction}
          className="space-y-6 border-t border-slate-200 p-6 sm:p-8"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="employeeId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Employee ID <span className="text-red-500">*</span>
              </label>

              <input
                id="employeeId"
                name="employeeId"
                defaultValue={teacher.employeeId}
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="firstName"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                First Name <span className="text-red-500">*</span>
              </label>

              <input
                id="firstName"
                name="firstName"
                defaultValue={teacher.firstName}
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Last Name <span className="text-red-500">*</span>
              </label>

              <input
                id="lastName"
                name="lastName"
                defaultValue={teacher.lastName}
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

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
                defaultValue={teacher.email ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                defaultValue={teacher.phone ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-6">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}
