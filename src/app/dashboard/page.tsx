import { db } from "@/prisma/db";

export default async function DashboardPage() {
  const [schools, students, teachers, activeSchools] = await Promise.all([
    db.orm.public.School.all(),
    db.orm.public.Student.all(),
    db.orm.public.Teacher.all(),
    db.orm.public.School.where((school) => school.status.eq("ACTIVE")).all(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Overview</h1>

        <p className="mt-1 text-sm text-gray-500">
          Monitor and manage your school management platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Total Schools</p>
          <p className="mt-2 text-3xl font-bold">{schools.length}</p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="mt-2 text-3xl font-bold">{students.length}</p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Total Teachers</p>
          <p className="mt-2 text-3xl font-bold">{teachers.length}</p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Active Schools</p>
          <p className="mt-2 text-3xl font-bold">{activeSchools.length}</p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold">Getting Started</h2>

        <p className="mt-2 text-sm text-gray-500">
          Your platform is ready. Start by registering and configuring your
          schools.
        </p>
      </div>
    </div>
  );
}
