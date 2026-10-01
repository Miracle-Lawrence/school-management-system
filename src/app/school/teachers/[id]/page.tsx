import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { updateTeacher } from "@/lib/services/teacher.service";

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

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/school/teachers"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back to Teachers
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-bold">
            {teacher.firstName} {teacher.lastName}
          </h1>

          <p className="mt-1 text-sm text-gray-500">Teacher Details</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Teacher Information</h2>

          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Employee ID:</span>{" "}
              {teacher.employeeId}
            </div>

            <div>
              <span className="font-medium">First Name:</span>{" "}
              {teacher.firstName}
            </div>

            <div>
              <span className="font-medium">Last Name:</span> {teacher.lastName}
            </div>

            <div>
              <span className="font-medium">Email:</span> {teacher.email ?? "—"}
            </div>

            <div>
              <span className="font-medium">Phone:</span> {teacher.phone ?? "—"}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Teaching Assignments</h2>

          {assignments.length === 0 ? (
            <p className="text-sm text-gray-500">
              No teaching assignments yet.
            </p>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-md border p-3">
                  <p className="font-medium">
                    {classMap.get(assignment.classId) ?? "Unknown Class"}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Subject:{" "}
                    {subjectMap.get(assignment.subjectId) ?? "Unknown Subject"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <details className="rounded-lg border bg-white">
        <summary className="cursor-pointer px-6 py-4 font-semibold">
          Edit Teacher Information
        </summary>

        <form action={updateTeacherAction} className="space-y-6 border-t p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium">
                Employee ID
              </label>

              <input
                id="employeeId"
                name="employeeId"
                defaultValue={teacher.employeeId}
                required
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium">
                First Name
              </label>

              <input
                id="firstName"
                name="firstName"
                defaultValue={teacher.firstName}
                required
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium">
                Last Name
              </label>

              <input
                id="lastName"
                name="lastName"
                defaultValue={teacher.lastName}
                required
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                defaultValue={teacher.email ?? ""}
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium">
                Phone
              </label>

              <input
                id="phone"
                name="phone"
                defaultValue={teacher.phone ?? ""}
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>
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
