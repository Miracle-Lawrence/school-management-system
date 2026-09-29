import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

type ParentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ParentDetailsPage({ params }: ParentPageProps) {
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

  const links = await db.orm.public.ParentStudent.where((link) =>
    link.parentId.eq(parentId),
  ).all();

  const students = await db.orm.public.Student.where((student) =>
    student.schoolId.eq(schoolId),
  ).all();

  const studentMap = new Map(students.map((student) => [student.id, student]));

  const children = links
    .map((link) => studentMap.get(link.studentId))
    .filter((student) => student !== undefined);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/school/parents"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back to Parents
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          {parent.firstName} {parent.lastName}
        </h1>

        <p className="mt-1 text-sm text-gray-500">Parent / Guardian Details</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Contact Information</h2>

          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Email:</span> {parent.email ?? "—"}
            </div>

            <div>
              <span className="font-medium">Phone:</span> {parent.phone ?? "—"}
            </div>

            <div>
              <span className="font-medium">Address:</span>{" "}
              {parent.address ?? "—"}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Children</h2>

            <Link
              href={`/school/parents/${parent.id}/children`}
              className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Manage Children
            </Link>
          </div>

          {children.length === 0 ? (
            <p className="text-sm text-gray-500">
              No students linked to this parent yet.
            </p>
          ) : (
            <div className="space-y-3">
              {children.map((student) => (
                <div key={student.id} className="rounded-md border p-3">
                  <p className="font-medium">
                    {student.firstName}{" "}
                    {student.middleName ? `${student.middleName} ` : ""}
                    {student.lastName}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Admission No: {student.admissionNumber}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
