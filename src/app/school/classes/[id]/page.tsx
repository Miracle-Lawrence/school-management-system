import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/authorization";
import { updateClass } from "@/lib/services/class.service";
import { db } from "@/prisma/db";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const updateClassSchema = z.object({
  name: z.string().trim().min(2).max(100),
  level: z.string().trim().max(50).optional().or(z.literal("")),
  description: z.string().trim().max(250).optional().or(z.literal("")),
});

export default async function ClassDetailsPage({ params }: PageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const { id } = await params;
  const classId = Number(id);

  if (!Number.isInteger(classId)) {
    notFound();
  }

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    notFound();
  }

  const students = await db.orm.public.Student.where((student) =>
    student.classId.eq(classId),
  ).all();

  const classSubjects = await db.orm.public.ClassSubject.where((assignment) =>
    assignment.classId.eq(classId),
  ).all();

  const teacherAssignments = await db.orm.public.TeacherAssignment.where(
    (assignment) => assignment.classId.eq(classId),
  ).all();

  async function updateClassAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const result = updateClassSchema.safeParse({
      name: formData.get("name"),
      level: formData.get("level"),
      description: formData.get("description"),
    });

    if (!result.success) {
      throw new Error(
        result.error.issues[0]?.message || "Invalid class information.",
      );
    }

    await updateClass(schoolId, classId, result.data);

    redirect(`/school/classes/${classId}`);
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-2 sm:px-4">
      {/* Page heading */}
      <div>
        <Link
          href="/school/classes"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Classes
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Academic Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {schoolClass.name}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {schoolClass.level && (
              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {schoolClass.level}
              </span>
            )}

            {schoolClass.description && (
              <p className="text-sm text-slate-600">
                {schoolClass.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Students
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {students.length}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Students assigned to this class
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Subjects
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {classSubjects.length}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Subjects offered by this class
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Teacher Assignments
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {teacherAssignments.length}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Current teaching assignments
          </p>
        </div>
      </section>

      {/* Class management */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Class Management
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Manage students, subjects, teachers, and attendance for this class.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={`/school/classes/${classId}/students`}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
              S
            </div>

            <h3 className="mt-4 font-semibold text-slate-900 transition group-hover:text-blue-600">
              Students
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              View and manage students assigned to this class.
            </p>
          </Link>

          <Link
            href={`/school/classes/${classId}/subjects`}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
              Su
            </div>

            <h3 className="mt-4 font-semibold text-slate-900 transition group-hover:text-blue-600">
              Subjects
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Manage subjects assigned to this class.
            </p>
          </Link>

          <Link
            href={`/school/classes/${classId}/teachers`}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
              T
            </div>

            <h3 className="mt-4 font-semibold text-slate-900 transition group-hover:text-blue-600">
              Teachers
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              View teachers assigned to this class.
            </p>
          </Link>

          <Link
            href={`/school/classes/${classId}/attendance`}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-sm font-bold text-green-700">
              A
            </div>

            <h3 className="mt-4 font-semibold text-slate-900 transition group-hover:text-green-600">
              Attendance
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Record daily attendance for this class.
            </p>
          </Link>

          <Link
            href={`/school/classes/${classId}/attendance/history`}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
              H
            </div>

            <h3 className="mt-4 font-semibold text-slate-900 transition group-hover:text-blue-600">
              Attendance History
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              View previous attendance records for this class.
            </p>
          </Link>

          <Link
            href={`/school/classes/${classId}/attendance/summary`}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
              Σ
            </div>

            <h3 className="mt-4 font-semibold text-slate-900 transition group-hover:text-blue-600">
              Attendance Summary
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              View attendance statistics for this class.
            </p>
          </Link>
        </div>
      </section>

      {/* Edit class */}
      <details className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-6 py-5 font-semibold text-slate-900 transition hover:bg-slate-50 sm:px-8">
          Edit Class Information
          <p className="mt-1 text-sm font-normal text-slate-600">
            Update the class name, level, or description.
          </p>
        </summary>

        <form
          action={updateClassAction}
          className="space-y-6 border-t border-slate-200 p-6 sm:p-8"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Class Name <span className="text-red-500">*</span>
              </label>

              <input
                id="name"
                name="name"
                defaultValue={schoolClass.name}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="level"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Level
              </label>

              <input
                id="level"
                name="level"
                defaultValue={schoolClass.level ?? ""}
                placeholder="e.g. Junior Secondary"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              defaultValue={schoolClass.description ?? ""}
              rows={4}
              placeholder="Optional class description"
              className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

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
