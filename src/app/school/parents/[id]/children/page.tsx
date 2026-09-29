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
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/school/parents/${parentId}`}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back to Parent
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Manage Children</h1>

        <p className="mt-1 text-sm text-gray-500">
          Link students to{" "}
          <span className="font-medium">
            {parent.firstName} {parent.lastName}
          </span>
          .
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Link a Student</h2>

        {availableStudents.length === 0 ? (
          <p className="text-sm text-gray-500">
            There are no available students to link.
          </p>
        ) : (
          <form
            action={linkStudentAction}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="studentId"
                className="mb-2 block text-sm font-medium"
              >
                Student
              </label>

              <select
                id="studentId"
                name="studentId"
                required
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Select a student</option>

                {availableStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} —{" "}
                    {student.admissionNumber}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Link Student
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Linked Children</h2>

        {existingLinks.length === 0 ? (
          <p className="text-sm text-gray-500">No children linked yet.</p>
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
                <div key={student.id} className="rounded-md border p-4">
                  <p className="font-medium">
                    {student.firstName}{" "}
                    {student.middleName ? `${student.middleName} ` : ""}
                    {student.lastName}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Admission No: {student.admissionNumber}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
