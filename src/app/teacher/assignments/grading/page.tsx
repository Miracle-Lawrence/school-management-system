import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";

export default async function AssignmentGradingPage() {
  const session = await requireRole(["TEACHER"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (!Number.isSafeInteger(userId) || userId <= 0 || !schoolId) {
    redirect("/login");
  }

  const teacher = await db.orm.public.Teacher.where({
    userId,
  }).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    redirect("/teacher");
  }

  const assignments = await db.orm.public.Assignment.where({
    schoolId,
    teacherId: teacher.id,
  }).all();

  const sortedAssignments = [...assignments].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  );

  const publishedAssignments = sortedAssignments.filter(
    (assignment) => assignment.isPublished,
  );

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Assignment Grading
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Review student submissions, award marks, and provide feedback.
          </p>
        </div>

        <Link
          href="/teacher/assignments"
          className="inline-flex w-fit items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Manage Assignments
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">All Assignments</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {sortedAssignments.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Published Assignments</p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {publishedAssignments.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Draft Assignments</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {sortedAssignments.length - publishedAssignments.length}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Your Assignments
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Open a published assignment to review its submissions.
          </p>
        </div>

        {sortedAssignments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium text-gray-700">
              No assignments created yet.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Create an assignment before you begin grading.
            </p>
            <Link
              href="/teacher/assignments"
              className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create Assignment
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {assignment.title}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        assignment.isPublished
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {assignment.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    Maximum score: {assignment.maxScore} marks
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Deadline:{" "}
                    {assignment.dueDate
                      ? new Date(assignment.dueDate).toLocaleString()
                      : "No deadline"}
                  </p>
                </div>

                {assignment.isPublished ? (
                  <Link
                    href={`/teacher/assignments/grading/${assignment.id}`}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Review Submissions
                  </Link>
                ) : (
                  <span className="text-sm text-gray-500">
                    Publish this assignment before grading.
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
