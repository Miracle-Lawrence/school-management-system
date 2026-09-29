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

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">School Dashboard</p>

          <h1 className="mt-1 text-3xl font-bold">{school.name}</h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage your school's students, teachers, parents, classes, and
            subjects.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm text-gray-500">Total Students</p>

            <p className="mt-2 text-3xl font-bold">{students.length}</p>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm text-gray-500">Total Teachers</p>

            <p className="mt-2 text-3xl font-bold">{teachers.length}</p>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm text-gray-500">Total Parents</p>

            <p className="mt-2 text-3xl font-bold">{parents.length}</p>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm text-gray-500">Total Classes</p>

            <p className="mt-2 text-3xl font-bold">{classes.length}</p>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm text-gray-500">Total Subjects</p>

            <p className="mt-2 text-3xl font-bold">{subjects.length}</p>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm text-gray-500">School Status</p>

            <p className="mt-2 text-3xl font-bold">{school.status}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
