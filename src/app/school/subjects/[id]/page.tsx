import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { updateSubject } from "@/lib/services/subject.service";

type SubjectDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const updateSubjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().max(30).optional().or(z.literal("")),
  description: z.string().trim().max(250).optional().or(z.literal("")),
});

export default async function SubjectDetailsPage({
  params,
}: SubjectDetailsPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const subjectId = Number(id);

  if (!Number.isInteger(subjectId)) {
    notFound();
  }

  const subject = await db.orm.public.Subject.where((subject) =>
    subject.id.eq(subjectId),
  ).first();

  if (!subject || subject.schoolId !== schoolId) {
    notFound();
  }

  const classSubjects = await db.orm.public.ClassSubject.where((assignment) =>
    assignment.subjectId.eq(subjectId),
  ).all();

  const classes = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.schoolId.eq(schoolId),
  ).all();

  const teachers = await db.orm.public.Teacher.where((teacher) =>
    teacher.schoolId.eq(schoolId),
  ).all();

  const teacherAssignments = await db.orm.public.TeacherAssignment.where(
    (assignment) => assignment.subjectId.eq(subjectId),
  ).all();

  const classMap = new Map(
    classes.map((schoolClass) => [schoolClass.id, schoolClass.name]),
  );

  const teacherMap = new Map(
    teachers.map((teacher) => [
      teacher.id,
      `${teacher.firstName} ${teacher.lastName}`,
    ]),
  );

  async function updateSubjectAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const result = updateSubjectSchema.safeParse({
      name: formData.get("name"),
      code: formData.get("code"),
      description: formData.get("description"),
    });

    if (!result.success) {
      throw new Error(
        result.error.issues[0]?.message || "Invalid subject information.",
      );
    }

    await updateSubject(schoolId, subjectId, result.data);

    redirect(`/school/subjects/${subjectId}`);
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-2 sm:px-4">
      {/* Back navigation */}
      <div>
        <Link
          href="/school/subjects"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Subjects
        </Link>
      </div>

      {/* Subject profile header */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-blue-700">
              {subject.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-600">
                Academic Management
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {subject.name}
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                {subject.code ? (
                  <>
                    Subject Code{" "}
                    <span className="font-semibold text-slate-800">
                      {subject.code}
                    </span>
                  </>
                ) : (
                  "Subject Details"
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subject information and assigned classes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subject information */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-900">
              Subject Information
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Basic information about this subject.
            </p>
          </div>

          <dl className="space-y-5 px-6 py-6">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Subject Name
              </dt>

              <dd className="mt-1 text-sm font-medium text-slate-900">
                {subject.name}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Subject Code
              </dt>

              <dd className="mt-1">
                {subject.code ? (
                  <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {subject.code}
                  </span>
                ) : (
                  <span className="text-sm text-slate-500">Not provided</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description
              </dt>

              <dd className="mt-1 text-sm leading-6 text-slate-900">
                {subject.description ?? "No description provided."}
              </dd>
            </div>
          </dl>
        </section>

        {/* Assigned classes */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="font-semibold text-slate-900">Assigned Classes</h2>

              <p className="mt-1 text-sm text-slate-600">
                Classes currently offering this subject.
              </p>
            </div>

            <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {classSubjects.length}
            </span>
          </div>

          <div className="p-6">
            {classSubjects.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <span className="text-xl font-bold">C</span>
                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
                  No classes assigned
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This subject has not been assigned to any class yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {classSubjects.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {classMap.get(assignment.classId) ?? "Unknown Class"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Subject assigned to class
                      </p>
                    </div>

                    <Link
                      href={`/school/classes/${assignment.classId}`}
                      className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                      View Class
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Assigned teachers */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <h2 className="font-semibold text-slate-900">
              Teachers Assigned to This Subject
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Teachers currently assigned to teach this subject.
            </p>
          </div>

          <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            {teacherAssignments.length}
          </span>
        </div>

        <div className="p-6 sm:p-8">
          {teacherAssignments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <span className="text-xl font-bold">T</span>
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No teachers assigned
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                No teachers have been assigned to this subject yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {teacherAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {(teacherMap.get(assignment.teacherId) ?? "UT")
                        .split(" ")
                        .map((name) => name.charAt(0))
                        .join("")
                        .slice(0, 2)}
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">
                        {teacherMap.get(assignment.teacherId) ??
                          "Unknown Teacher"}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        Class:{" "}
                        <span className="font-medium text-slate-800">
                          {classMap.get(assignment.classId) ?? "Unknown Class"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Edit subject */}
      <details className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-6 py-5 font-semibold text-slate-900 transition hover:bg-slate-50 sm:px-8">
          Edit Subject Information
          <p className="mt-1 text-sm font-normal text-slate-600">
            Update the subject name, code, or description.
          </p>
        </summary>

        <form
          action={updateSubjectAction}
          className="space-y-6 border-t border-slate-200 p-6 sm:p-8"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Subject Name
              </label>

              <input
                id="name"
                name="name"
                defaultValue={subject.name}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="code"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Subject Code
              </label>

              <input
                id="code"
                name="code"
                defaultValue={subject.code ?? ""}
                placeholder="e.g. MATH"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm uppercase text-slate-900 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              defaultValue={subject.description ?? ""}
              rows={4}
              placeholder="Optional subject description"
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
