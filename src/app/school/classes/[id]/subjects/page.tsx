import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

type ClassSubjectsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClassSubjectsPage({
  params,
}: ClassSubjectsPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const classId = Number(id);

  if (!Number.isInteger(classId)) {
    notFound();
  }

  const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    notFound();
  }

  const assignments = await db.orm.public.ClassSubject.where((assignment) =>
    assignment.classId.eq(classId),
  ).all();

  const subjects = await db.orm.public.Subject.where((subject) =>
    subject.schoolId.eq(schoolId),
  ).all();

  const assignedSubjectIds = new Set(
    assignments.map((assignment) => assignment.subjectId),
  );

  const assignedSubjects = assignments
    .map((assignment) => {
      const subject = subjects.find(
        (subject) => subject.id === assignment.subjectId,
      );

      return {
        assignment,
        subject,
      };
    })
    .filter((item) => item.subject);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/school/classes"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to Classes
        </Link>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{schoolClass.name}</h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage subjects assigned to this class.
            </p>
          </div>

          <Link
            href={`/school/classes/${classId}/subjects/new`}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Assign Subject
          </Link>
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Assigned Subjects</h2>
        </div>

        {assignedSubjects.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            No subjects have been assigned to this class yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium">Subject</th>

                  <th className="px-6 py-3 font-medium">Code</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {assignedSubjects.map(({ assignment, subject }) => (
                  <tr key={assignment.id}>
                    <td className="px-6 py-4 font-medium">{subject?.name}</td>

                    <td className="px-6 py-4">{subject?.code || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="font-semibold">Available Subjects</h2>

        <div className="mt-4 space-y-2">
          {subjects
            .filter((subject) => !assignedSubjectIds.has(subject.id))
            .map((subject) => (
              <div
                key={subject.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">{subject.name}</p>

                  {subject.code && (
                    <p className="text-xs text-gray-500">{subject.code}</p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
