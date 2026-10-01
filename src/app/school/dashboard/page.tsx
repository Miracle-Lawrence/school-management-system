import { db } from "@/prisma/db";
import { requireRole } from "@/lib/auth/authorization";

export default async function SchoolDashboardPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const [school, students, teachers, parents, classes, subjects] =
    await Promise.all([
      db.orm.public.School.where((school) => school.id.eq(schoolId)).first(),

      db.orm.public.Student.where((student) =>
        student.schoolId.eq(schoolId),
      ).all(),

      db.orm.public.Teacher.where((teacher) =>
        teacher.schoolId.eq(schoolId),
      ).all(),

      db.orm.public.Parent.where((parent) =>
        parent.schoolId.eq(schoolId),
      ).all(),

      db.orm.public.SchoolClass.where((schoolClass) =>
        schoolClass.schoolId.eq(schoolId),
      ).all(),

      db.orm.public.Subject.where((subject) =>
        subject.schoolId.eq(schoolId),
      ).all(),
    ]);

  if (!school) {
    throw new Error("School not found.");
  }

  const stats = [
    {
      label: "Total Students",
      value: students.length,
      description: "Students registered in your school",
    },
    {
      label: "Total Teachers",
      value: teachers.length,
      description: "Teachers currently registered",
    },
    {
      label: "Total Parents",
      value: parents.length,
      description: "Parents and guardians registered",
    },
    {
      label: "Total Classes",
      value: classes.length,
      description: "Classes currently available",
    },
    {
      label: "Total Subjects",
      value: subjects.length,
      description: "Subjects available in the school",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              School Overview
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {school.name}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage your school's students, teachers, parents, classes, and
              subjects from one place.
            </p>
          </div>

          <div className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
            <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">
              {school.status}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            School Statistics
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            A quick overview of your school's current records.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>

              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {stat.value}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {stat.description}
              </p>
            </div>
          ))}

          {/* School status card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-sm font-medium text-slate-600">School Status</p>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

              <p className="text-xl font-bold text-slate-900">
                {school.status}
              </p>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Current status of your school account.
            </p>
          </div>
        </div>
      </section>

      {/* Quick overview */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Quick Overview
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Your school currently has{" "}
            <span className="font-semibold text-slate-900">
              {students.length} students
            </span>{" "}
            across{" "}
            <span className="font-semibold text-slate-900">
              {classes.length} classes
            </span>
            .
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Students
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {students.length}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Teachers
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {teachers.length}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Subjects
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {subjects.length}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
