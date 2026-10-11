import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import AttendanceForm from "@/app/school/classes/[id]/attendance/attendance-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TeacherClassAttendancePage({
  params,
}: PageProps) {
  const session = await requireRole(["TEACHER"]);

  const { id } = await params;
  const classId = Number(id);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (
    !Number.isSafeInteger(classId) ||
    classId <= 0 ||
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    !schoolId
  ) {
    notFound();
  }

  const teacher = await db.orm.public.Teacher.where((teacher) =>
    teacher.userId.eq(userId),
  ).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    notFound();
  }

  const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    notFound();
  }

  const assignments = await db.orm.public.TeacherAssignment.where(
    (assignment) => assignment.teacherId.eq(teacher.id),
  ).all();

  const isAssigned = assignments.some(
    (assignment) =>
      assignment.schoolId === schoolId && assignment.classId === classId,
  );

  if (!isAssigned) {
    notFound();
  }

  const [studentRecords, academicSessions] = await Promise.all([
    db.orm.public.Student.where((student) => student.classId.eq(classId)).all(),
    db.orm.public.AcademicSession.where((academicSession) =>
      academicSession.schoolId.eq(schoolId),
    ).all(),
  ]);

  const students = studentRecords
    .filter((student) => student.schoolId === schoolId && student.isActive)
    .map((student) => ({
      id: student.id,
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
    }));

  const activeSession =
    academicSessions.find((academicSession) => academicSession.isActive) ??
    null;

  let activeTerm = null;

  if (activeSession) {
    const terms = await db.orm.public.Term.where((term) =>
      term.sessionId.eq(activeSession.id),
    ).all();

    activeTerm = terms.find((term) => term.isActive) ?? null;
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-2 sm:px-4">
      <div>
        <Link
          href={`/teacher/classes/${classId}/students`}
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to {schoolClass.name}
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">Teacher Portal</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Class Attendance
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Record attendance for your assigned class{" "}
            <span className="font-semibold text-slate-900">
              {schoolClass.name}
            </span>
            .
          </p>
        </div>
      </div>

      {!activeSession && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">
            No active academic session
          </h2>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            Attendance cannot be recorded until your school administrator
            activates an academic session.
          </p>
        </div>
      )}

      {activeSession && !activeTerm && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">No active term</h2>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            Ask your school administrator to activate a term for the current
            academic session.
          </p>
        </div>
      )}

      {activeSession && activeTerm && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
            <h2 className="font-semibold text-slate-900">
              Current Academic Period
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Attendance will be recorded under the active session and term.
            </p>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Academic Session
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {activeSession.name}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current Term
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {activeTerm.name}
              </p>
            </div>
          </div>
        </section>
      )}

      {activeSession && activeTerm && students.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
            <h2 className="font-semibold text-slate-900">Record Attendance</h2>
            <p className="mt-1 text-sm text-slate-600">
              Mark attendance for students in {schoolClass.name}.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <AttendanceForm
              students={students}
              classId={classId}
              termId={activeTerm.id}
            />
          </div>
        </section>
      )}

      {students.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            No active students
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            There are no active students assigned to {schoolClass.name}. Contact
            your school administrator if this seems incorrect.
          </p>
        </div>
      )}
    </div>
  );
}
