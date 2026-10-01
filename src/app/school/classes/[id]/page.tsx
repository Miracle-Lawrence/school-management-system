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
    throw new Error("Invalid class.");
  }

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    throw new Error("Class not found.");
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
    <div className="space-y-6">
      <div>
        <Link
          href="/school/classes"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Classes
        </Link>

        <h1 className="mt-2 text-2xl font-bold">{schoolClass.name}</h1>

        {schoolClass.level && (
          <p className="mt-1 text-gray-600">Level: {schoolClass.level}</p>
        )}

        {schoolClass.description && (
          <p className="mt-2 text-sm text-gray-600">
            {schoolClass.description}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Students</p>

          <p className="mt-2 text-2xl font-bold">{students.length}</p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Subjects</p>

          <p className="mt-2 text-2xl font-bold">{classSubjects.length}</p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Teacher Assignments</p>

          <p className="mt-2 text-2xl font-bold">{teacherAssignments.length}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/school/classes/${classId}/students`}
          className="rounded-lg border bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <h2 className="font-semibold">Students</h2>

          <p className="mt-1 text-sm text-gray-500">
            View students assigned to this class.
          </p>
        </Link>

        <Link
          href={`/school/classes/${classId}/subjects`}
          className="rounded-lg border bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <h2 className="font-semibold">Subjects</h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage subjects assigned to this class.
          </p>
        </Link>

        <Link
          href={`/school/classes/${classId}/teachers`}
          className="rounded-lg border bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <h2 className="font-semibold">Teachers</h2>

          <p className="mt-1 text-sm text-gray-500">
            View teachers assigned to this class.
          </p>
        </Link>

        <Link
          href={`/school/classes/${classId}/attendance`}
          className="rounded-lg border bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <h2 className="font-semibold">Attendance</h2>

          <p className="mt-1 text-sm text-gray-500">
            Record daily attendance for this class.
          </p>
        </Link>

        <Link
          href={`/school/classes/${classId}/attendance/history`}
          className="rounded-lg border bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <h2 className="font-semibold">Attendance History</h2>

          <p className="mt-1 text-sm text-gray-500">
            View previous attendance records.
          </p>
        </Link>

        <Link
          href={`/school/classes/${classId}/attendance/summary`}
          className="rounded-lg border bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <h2 className="font-semibold">Attendance Summary</h2>

          <p className="mt-1 text-sm text-gray-500">
            View attendance statistics for the class.
          </p>
        </Link>
      </div>

      <details className="rounded-lg border bg-white">
        <summary className="cursor-pointer px-6 py-4 font-semibold">
          Edit Class Information
        </summary>

        <form action={updateClassAction} className="space-y-6 border-t p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Class Name
              </label>

              <input
                id="name"
                name="name"
                defaultValue={schoolClass.name}
                required
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="level" className="block text-sm font-medium">
                Level
              </label>

              <input
                id="level"
                name="level"
                defaultValue={schoolClass.level ?? ""}
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium">
              Description
            </label>

            <textarea
              id="description"
              name="description"
              defaultValue={schoolClass.description ?? ""}
              rows={3}
              className="mt-2 w-full rounded-md border px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Save Changes
          </button>
        </form>
      </details>
    </div>
  );
}
