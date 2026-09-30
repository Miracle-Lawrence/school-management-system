import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import Link from "next/link";
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
    <div className="space-y-6">
      <div>
        <Link
          href={`/school/classes/${classId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Class
        </Link>

        <h1 className="mt-2 text-2xl font-bold">Attendance</h1>

        <p className="text-gray-600">{schoolClass.name}</p>
      </div>

      {!activeSession && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
          There is no active academic session. Activate an academic session
          before recording attendance.
        </div>
      )}

      {activeSession && !activeTerm && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
          There is no active term for the current academic session. Activate a
          term before recording attendance.
        </div>
      )}

      {activeSession && activeTerm && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Current Academic Period</h2>

          <div className="mt-3 space-y-1 text-sm text-gray-600">
            <p>
              <span className="font-medium">Session:</span> {activeSession.name}
            </p>

            <p>
              <span className="font-medium">Term:</span> {activeTerm.name}
            </p>
          </div>
        </div>
      )}

      {activeSession && activeTerm && (
        <AttendanceForm
          students={students}
          classId={classId}
          termId={activeTerm.id}
        />
      )}

      {students.length === 0 && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-gray-500">
            No students are currently assigned to this class.
          </p>
        </div>
      )}
    </div>
  );
}
