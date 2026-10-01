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
    <div className="space-y-8">
      <div>
        <Link
          href="/school/subjects"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back to Subjects
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-bold">{subject.name}</h1>

          <p className="mt-1 text-sm text-gray-500">Subject Details</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Subject Information</h2>

          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Name:</span> {subject.name}
            </div>

            <div>
              <span className="font-medium">Code:</span> {subject.code ?? "—"}
            </div>

            <div>
              <span className="font-medium">Description:</span>{" "}
              {subject.description ?? "—"}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Assigned Classes</h2>

          {classSubjects.length === 0 ? (
            <p className="text-sm text-gray-500">
              This subject has not been assigned to any class yet.
            </p>
          ) : (
            <div className="space-y-3">
              {classSubjects.map((assignment) => (
                <div key={assignment.id} className="rounded-md border p-3">
                  <p className="font-medium">
                    {classMap.get(assignment.classId) ?? "Unknown Class"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Teachers Assigned to This Subject
        </h2>

        {teacherAssignments.length === 0 ? (
          <p className="text-sm text-gray-500">
            No teachers have been assigned to this subject yet.
          </p>
        ) : (
          <div className="space-y-3">
            {teacherAssignments.map((assignment) => (
              <div key={assignment.id} className="rounded-md border p-3">
                <p className="font-medium">
                  {teacherMap.get(assignment.teacherId) ?? "Unknown Teacher"}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Class: {classMap.get(assignment.classId) ?? "Unknown Class"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <details className="rounded-lg border bg-white">
        <summary className="cursor-pointer px-6 py-4 font-semibold">
          Edit Subject Information
        </summary>

        <form action={updateSubjectAction} className="space-y-6 border-t p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Subject Name
              </label>

              <input
                id="name"
                name="name"
                defaultValue={subject.name}
                required
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium">
                Subject Code
              </label>

              <input
                id="code"
                name="code"
                defaultValue={subject.code ?? ""}
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
              defaultValue={subject.description ?? ""}
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
