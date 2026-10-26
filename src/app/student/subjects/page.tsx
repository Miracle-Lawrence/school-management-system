import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { redirect } from "next/navigation";

export default async function StudentSubjectsPage() {
  const session = await requireRole(["STUDENT"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (!Number.isInteger(userId) || !schoolId) {
    redirect("/login");
  }

  const student = await db.orm.public.Student.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!student || student.schoolId !== schoolId || !student.isActive) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-900">
          My Class & Subjects
        </h1>
        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">
            Student profile unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Your account is not linked to an active student record. Please
            contact your school administrator.
          </p>
        </section>
      </div>
    );
  }

  const schoolClass = student.classId
    ? await db.orm.public.SchoolClass.where((item) =>
        item.id.eq(student.classId!),
      ).first()
    : null;

  const validClass =
    schoolClass && schoolClass.schoolId === schoolId ? schoolClass : null;

  const classSubjects = validClass
    ? await db.orm.public.ClassSubject.where((item) =>
        item.classId.eq(validClass.id),
      ).all()
    : [];

  const subjectRecords = await Promise.all(
    classSubjects
      .filter((item) => item.schoolId === schoolId)
      .map(async (classSubject) => {
        const subject = await db.orm.public.Subject.where((item) =>
          item.id.eq(classSubject.subjectId),
        ).first();

        if (!subject || subject.schoolId !== schoolId) {
          return null;
        }

        return subject;
      }),
  );

  const subjects = subjectRecords.filter((subject) => subject !== null);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-blue-600">Student portal</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          My Class & Subjects
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          View your assigned class and the subjects registered for that class.
        </p>
      </header>

      <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-medium text-blue-100">My current class</p>
        <h2 className="mt-2 text-2xl font-bold">
          {validClass?.name ?? "No class assigned"}
        </h2>
        {validClass?.level && (
          <p className="mt-2 text-sm text-blue-100">
            Level: {validClass.level}
          </p>
        )}
        {validClass?.description && (
          <p className="mt-2 text-sm leading-6 text-blue-100">
            {validClass.description}
          </p>
        )}
      </section>

      {!validClass ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">Class not assigned</h2>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Your student record does not currently have a class assigned.
            Please contact your school administrator.
          </p>
        </section>
      ) : (
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                My subjects
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Subjects linked to your class.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {subjects.length} {subjects.length === 1 ? "subject" : "subjects"}
            </span>
          </div>

          {subjects.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-slate-900">
                No subjects available yet
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your school has not linked any subjects to this class yet.
                Please contact your school administrator if you believe this
                is incorrect.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <article
                  key={subject.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-700">
                    {subject.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">
                    {subject.name}
                  </h3>
                  {subject.code && (
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Code: {subject.code}
                    </p>
                  )}
                  {subject.description && (
                    <p className="mt-3 text-sm leading-5 text-slate-600">
                      {subject.description}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
