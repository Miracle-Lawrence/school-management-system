import Link from "next/link";
import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export default async function TeacherDashboardPage() {
  const session = await requireRole(["TEACHER"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        Your account is not linked to a school. Please contact your school
        administrator.
      </div>
    );
  }

  const teacher = await db.orm.public.Teacher.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Your teacher profile has not been configured correctly. Please contact
        your school administrator.
      </div>
    );
  }

  const assignments = await db.orm.public.TeacherAssignment.where((item) =>
    item.teacherId.eq(teacher.id),
  ).all();

  const schoolClasses = await db.orm.public.SchoolClass.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const subjects = await db.orm.public.Subject.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const students = await db.orm.public.Student.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const assignedClassIds = new Set(
    assignments.map((assignment) => assignment.classId),
  );

  const assignedSubjectIds = new Set(
    assignments.map((assignment) => assignment.subjectId),
  );

  const classes = schoolClasses.filter((schoolClass) =>
    assignedClassIds.has(schoolClass.id),
  );

  const teacherSubjects = subjects.filter((subject) =>
    assignedSubjectIds.has(subject.id),
  );

  const activeStudents = students.filter(
    (student) =>
      student.isActive &&
      student.classId !== null &&
      assignedClassIds.has(student.classId),
  );

  const classCards = classes.map((schoolClass) => {
    const classAssignments = assignments.filter(
      (assignment) => assignment.classId === schoolClass.id,
    );

    const classSubjectNames = classAssignments
      .map(
        (assignment) =>
          teacherSubjects.find((subject) => subject.id === assignment.subjectId)
            ?.name,
      )
      .filter((name): name is string => Boolean(name));

    const studentCount = activeStudents.filter(
      (student) => student.classId === schoolClass.id,
    ).length;

    return {
      id: schoolClass.id,
      name: schoolClass.name,
      level: schoolClass.level,
      studentCount,
      subjects: [...new Set(classSubjectNames)],
    };
  });

  return (
    <main className="space-y-8">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-900 p-6 text-white sm:p-8">
        <p className="text-sm font-medium text-blue-200">TEACHER PORTAL</p>

        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
          Welcome, {teacher.firstName} {teacher.lastName}
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-200">
          Manage your teaching assignments, view your classes, and keep track of
          your students from one place.
        </p>

        <div className="mt-5 inline-flex rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm">
          Employee ID: {teacher.employeeId}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Teaching overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            A summary of your current teaching assignments.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            label="Assigned Classes"
            value={classes.length}
            description="Classes assigned to you"
          />

          <SummaryCard
            label="Subjects"
            value={teacherSubjects.length}
            description="Subjects you teach"
          />

          <SummaryCard
            label="Students"
            value={activeStudents.length}
            description="Active students in your assigned classes"
          />
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">My classes</h2>
          <p className="mt-1 text-sm text-slate-500">
            Classes and subjects connected to your assignments.
          </p>
        </div>

        {classCards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h3 className="font-semibold text-slate-800">
              No class assignments yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Your assigned classes will appear here once your school
              administrator configures your teaching assignments.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classCards.map((schoolClass) => (
              <article
                key={schoolClass.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {schoolClass.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {schoolClass.level || "Class level not specified"}
                    </p>
                  </div>

                  <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                    {schoolClass.studentCount} students
                  </span>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Your subjects
                  </p>

                  {schoolClass.subjects.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {schoolClass.subjects.map((subject) => (
                        <span
                          key={subject}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      No subjects listed.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Quick access</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <QuickAccessCard
            title="My classes"
            description="Review your assigned classes and subjects."
            href="/teacher/classes"
          />

          <QuickAccessCard
            title="My profile"
            description="View your teacher account information."
            href="/teacher/profile"
          />
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </article>
  );
}

function QuickAccessCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
    >
      <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">
        {title}
      </h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <p className="mt-3 text-sm font-medium text-blue-700">Open section →</p>
    </Link>
  );
}
