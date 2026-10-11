import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export default async function TeacherAttendancePage() {
  const session = await requireRole(["TEACHER"]);
  const schoolId = session.user.schoolId;
  const userId = Number(session.user.id);

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const teacher = await db.orm.public.Teacher.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Your teacher profile is not configured correctly. Please contact your
        school administrator.
      </div>
    );
  }

  const [assignments, schoolClasses, students] = await Promise.all([
    db.orm.public.TeacherAssignment.where((item) =>
      item.teacherId.eq(teacher.id),
    ).all(),
    db.orm.public.SchoolClass.where((item) => item.schoolId.eq(schoolId)).all(),
    db.orm.public.Student.where((item) => item.schoolId.eq(schoolId)).all(),
  ]);

  const assignedClassIds = new Set(
    assignments
      .filter((assignment) => assignment.schoolId === schoolId)
      .map((assignment) => assignment.classId),
  );

  const classes = schoolClasses
    .filter((schoolClass) => assignedClassIds.has(schoolClass.id))
    .map((schoolClass) => ({
      ...schoolClass,
      studentCount: students.filter(
        (student) => student.isActive && student.classId === schoolClass.id,
      ).length,
    }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Teaching & Learning
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Attendance
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Select one of your assigned classes to record student attendance.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-slate-600">Assigned classes</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">
          {classes.length}
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="font-semibold text-slate-900">No assigned classes</h2>

          <p className="mt-2 text-sm text-slate-600">
            Your school administrator must assign you to a class before you can
            record attendance.
          </p>

          <Link
            href="/teacher/classes"
            className="mt-4 inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View My Classes
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((schoolClass) => (
            <article
              key={schoolClass.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                {schoolClass.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {schoolClass.level || "Class level not specified"}
              </p>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-600">
                  Active students:{" "}
                  <span className="font-semibold text-slate-900">
                    {schoolClass.studentCount}
                  </span>
                </p>

                <Link
                  href={`/teacher/classes/${schoolClass.id}/attendance`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Take Attendance
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
