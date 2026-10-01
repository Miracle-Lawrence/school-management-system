import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { linkStudentToParent } from "@/lib/services/parent-student.service";

type ManageChildrenPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ManageChildrenPage({
  params,
}: ManageChildrenPageProps) {
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

  const students = await db.orm.public.Student.where((student) =>
    student.schoolId.eq(schoolId),
  ).all();

  const existingLinks = await db.orm.public.ParentStudent.where((link) =>
    link.parentId.eq(parentId),
  ).all();

  const linkedStudentIds = new Set(existingLinks.map((link) => link.studentId));

  const availableStudents = students.filter(
    (student) => !linkedStudentIds.has(student.id),
  );

  async function linkStudentAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const studentIdValue = formData.get("studentId");
    const studentId = Number(studentIdValue);

    if (!Number.isInteger(studentId)) {
      throw new Error("Invalid student.");
    }

    await linkStudentToParent(schoolId, parentId, studentId);

    redirect(`/school/parents/${parentId}/children`);
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-2 sm:px-4">
      {/* Page heading */}
      <div>
        <Link
          href={`/school/parents/${parentId}`}
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Parent Profile
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Family Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Manage Children
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Manage the students linked to{" "}
            <span className="font-semibold text-slate-800">
              {parent.firstName} {parent.lastName}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-slate-600">Linked children</p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {existingLinks.length}
        </p>
      </div>

      {/* Link student */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <h2 className="text-base font-semibold text-slate-900">
            Link a Student
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Select a student to add to this parent's family records.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {availableStudents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <span className="text-xl font-bold">✓</span>
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No available students
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                All students currently have a link to this parent, or there are
                no student records available.
              </p>
            </div>
          ) : (
            <form
              action={linkStudentAction}
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <label
                  htmlFor="studentId"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Select Student
                </label>

                <select
                  id="studentId"
                  name="studentId"
                  required
                  defaultValue=""
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="" disabled>
                    Select a student
                  </option>

                  {availableStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.firstName}{" "}
                      {student.middleName ? `${student.middleName} ` : ""}
                      {student.lastName} — {student.admissionNumber}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                + Link Student
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Linked children */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <h2 className="text-base font-semibold text-slate-900">
            Linked Children
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Students currently associated with this parent or guardian.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {existingLinks.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <span className="text-xl font-bold">S</span>
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No children linked yet
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use the form above to link the first student to this parent.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {existingLinks.map((link) => {
                const student = students.find(
                  (item) => item.id === link.studentId,
                );

                if (!student) {
                  return null;
                }

                return (
                  <div
                    key={student.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
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
                          Admission No:{" "}
                          <span className="font-medium text-slate-800">
                            {student.admissionNumber}
                          </span>
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
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
