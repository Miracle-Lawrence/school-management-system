import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export default async function ParentDashboardPage() {
    const session = await requireRole(["PARENT"]);
    const userId = Number(session.user.id);

    const user = await db.orm.public.User.where((item) =>
      item.id.eq(userId),
    ).first();

    if (!user || !user.isActive) {
      redirect("/login");
    }

    if (user.mustChangePassword) {
      redirect("/parent/change-password");
    }

  const schoolId = session.user.schoolId;


  if (!schoolId || !Number.isInteger(userId)) {
    throw new Error("Parent account is missing its school or user context.");
  }

  // Find the parent profile belonging to the authenticated login.
  const parent = await db.orm.public.Parent.where((item) =>
    item.userId.eq(userId),
  ).first();

  // Do not display any children unless this login is linked to a parent profile.
  if (!parent || parent.schoolId !== schoolId) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Parent portal</h1>

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">
            Your parent profile is not linked yet
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            Please contact your school administrator to link your login account
            to your parent or guardian record.
          </p>
        </section>
      </main>
    );
  }

  const links = await db.orm.public.ParentStudent.where((item) =>
    item.parentId.eq(parent.id),
  ).all();

  // Restrict the child records to this parent's links and their school.
  const linkedStudentIds = new Set(links.map((link) => link.studentId));

  const schoolStudents = await db.orm.public.Student.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const children = schoolStudents.filter((student) =>
    linkedStudentIds.has(student.id),
  );

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header>
        <p className="text-sm font-semibold text-blue-600">Family portal</p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Welcome{parent.firstName ? `, ${parent.firstName}` : ""}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          View the student records linked to your parent account.
        </p>
      </header>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">My children</h2>

          <p className="text-sm text-slate-600">
            {children.length} linked{" "}
            {children.length === 1 ? "student" : "students"}
          </p>
        </div>

        {children.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="font-medium text-slate-900">
              No students are linked to your account yet.
            </p>

            <p className="mt-1 text-sm text-slate-600">
              Contact your school administrator to link your child or children.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {children.map((student) => (
              <article
                key={student.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-900">
                  {student.firstName} {student.lastName}
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  Admission number: {student.admissionNumber}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
