import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export default async function TeacherClassesPage() {
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

  const assignments = await db.orm.public.TeacherAssignment.where((item) =>
    item.teacherId.eq(teacher.id),
  ).all();

  const [schoolClasses, subjects, students] = await Promise.all([
    db.orm.public.SchoolClass.where((item) => item.schoolId.eq(schoolId)).all(),
    db.orm.public.Subject.where((item) => item.schoolId.eq(schoolId)).all(),
    db.orm.public.Student.where((item) => item.schoolId.eq(schoolId)).all(),
  ]);

  const assignedClassIds = new Set(
    assignments.map((assignment) => assignment.classId),
  );

  const classes = schoolClasses.filter((schoolClass) =>
    assignedClassIds.has(schoolClass.id),
  );

  const activeStudents = students.filter(
    (student) =>
      student.isActive &&
      student.classId !== null &&
      assignedClassIds.has(student.classId),
  );

  const classRows = classes.map((schoolClass) => {
    const classAssignments = assignments.filter(
      (assignment) => assignment.classId === schoolClass.id,
    );

    const classSubjects = [
      ...new Set(
        classAssignments
          .map(
            (assignment) =>
              subjects.find((subject) => subject.id === assignment.subjectId)
                ?.name,
          )
          .filter((name): name is string => Boolean(name)),
      ),
    ];

    const studentCount = activeStudents.filter(
      (student) => student.classId === schoolClass.id,
    ).length;

    return {
      ...schoolClass,
      subjects: classSubjects,
      studentCount,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Teaching & Learning
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          My Classes
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          View your assigned classes, teaching subjects, and student
          information.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-600">Assigned classes</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {classes.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-600">
            Active students in your classes
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {activeStudents.length}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {classRows.length === 0 ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-xl font-bold">C</span>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No assigned classes
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Your classes will appear here when your school administrator
              assigns classes and subjects to your teacher profile.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Class
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Level
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Subjects
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Active students
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {classRows.map((schoolClass) => (
                  <tr
                    key={schoolClass.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {schoolClass.name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {schoolClass.level ?? "—"}
                    </td>

                    <td className="px-6 py-4">
                      {schoolClass.subjects.length > 0 ? (
                        <div className="flex max-w-sm flex-wrap gap-1.5">
                          {schoolClass.subjects.map((subject) => (
                            <span
                              key={subject}
                              className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">No subjects</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {schoolClass.studentCount}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/teacher/classes/${schoolClass.id}/students`}
                        className="inline-flex items-center rounded-md bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        View students
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
