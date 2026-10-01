import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

import AttendanceForm from "./attendance-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClassAttendancePage({ params }: PageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const { id } = await params;
  const classId = Number(id);

  if (!Number.isInteger(classId)) {
    throw new Error("Invalid class.");
  }

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    throw new Error("Class not found.");
  }

  const studentRecords = await db.orm.public.Student.where((student) =>
    student.classId.eq(classId),
  ).all();

  const students = studentRecords.map((student) => ({
    id: student.id,
    admissionNumber: student.admissionNumber,
    firstName: student.firstName,
    middleName: student.middleName,
    lastName: student.lastName,
  }));

  const academicSessions = await db.orm.public.AcademicSession.where(
    (academicSession) => academicSession.schoolId.eq(schoolId),
  ).all();

  const activeSession = academicSessions.find(
    (academicSession) => academicSession.isActive,
  );

  let activeTerm = null;

  if (activeSession) {
    const terms = await db.orm.public.Term.where((term) =>
      term.sessionId.eq(activeSession.id),
    ).all();

    activeTerm = terms.find((term) => term.isActive) ?? null;
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-2 sm:px-4">
      {/* Page heading */}
      <div>
        <Link
          href={`/school/classes/${classId}`}
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to {schoolClass.name}
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Class Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Attendance
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Record and manage attendance for{" "}
            <span className="font-semibold text-slate-900">
              {schoolClass.name}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Academic period */}
      {!activeSession && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-amber-600">
              <span className="font-bold">!</span>
            </div>

            <div>
              <h2 className="font-semibold text-amber-900">
                No active academic session
              </h2>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Activate an academic session before recording attendance.
              </p>

              <Link
                href="/school/academic-sessions"
                className="mt-3 inline-flex text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Manage Academic Sessions →
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeSession && !activeTerm && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-amber-600">
              <span className="font-bold">!</span>
            </div>

            <div>
              <h2 className="font-semibold text-amber-900">No active term</h2>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                There is no active term for the current academic session.
                Activate a term before recording attendance.
              </p>

              <Link
                href={`/school/academic-sessions/${activeSession.id}`}
                className="mt-3 inline-flex text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Manage Current Session →
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeSession && activeTerm && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Current Academic Period
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Attendance will be recorded under the active session and term.
                </p>
              </div>

              <span className="inline-flex shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Active
              </span>
            </div>
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

      {/* Attendance form */}
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

      {/* No students */}
      {students.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <span className="text-xl font-bold">S</span>
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No students assigned
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            There are currently no students assigned to {schoolClass.name}.
            Assign students to this class before recording attendance.
          </p>

          <Link
            href={`/school/classes/${classId}/students`}
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            View Class Students
          </Link>
        </div>
      )}
    </div>
  );
}
