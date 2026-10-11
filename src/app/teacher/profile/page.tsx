import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export default async function TeacherProfilePage() {
  const session = await requireRole(["TEACHER"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    return (
      <main className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        Your account is not linked to a school. Please contact your school
        administrator.
      </main>
    );
  }

  const teacher = await db.orm.public.Teacher.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Your teacher profile has not been configured correctly. Please contact
        your school administrator.
      </main>
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

  const assignedClasses = schoolClasses.filter((schoolClass) =>
    assignments.some((assignment) => assignment.classId === schoolClass.id),
  );

  const assignedSubjects = subjects.filter((subject) =>
    assignments.some((assignment) => assignment.subjectId === subject.id),
  );

  const fullName = `${teacher.firstName} ${teacher.lastName}`;

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-900 p-6 text-white sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-200">
          Teacher portal
        </p>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-2xl font-bold ring-1 ring-white/30">
            {teacher.firstName.charAt(0)}
            {teacher.lastName.charAt(0)}
          </div>

          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{fullName}</h1>
            <p className="mt-2 text-sm text-blue-100">
              Employee ID: {teacher.employeeId}
            </p>
            <span className="mt-3 inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
              Teacher account
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Assigned classes" value={assignedClasses.length} />
        <SummaryCard label="Subjects taught" value={assignedSubjects.length} />
        <SummaryCard label="Employee ID" value={teacher.employeeId} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            Personal and account information
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review the information associated with your teacher account. Contact
            your school administrator if anything needs to be updated.
          </p>
        </div>

        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <ProfileField label="First name" value={teacher.firstName} />
          <ProfileField label="Last name" value={teacher.lastName} />
          <ProfileField
            label="Email address"
            value={teacher.email || session.user.email || ""}
          />
          <ProfileField label="Phone number" value={teacher.phone || ""} />
          <ProfileField label="Employee ID" value={teacher.employeeId} />
          <ProfileField label="Account role" value="Teacher" />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            My teaching assignments
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            These are the classes and subjects assigned to you by your school.
          </p>
        </div>

        {assignments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
            <p className="font-medium text-slate-700">
              No teaching assignments yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Your school administrator can configure your classes and subjects.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Level</th>
                  <th className="px-4 py-3 font-semibold">Subject</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => {
                  const schoolClass = assignedClasses.find(
                    (item) => item.id === assignment.classId,
                  );
                  const subject = assignedSubjects.find(
                    (item) => item.id === assignment.subjectId,
                  );

                  if (!schoolClass || !subject) {
                    return null;
                  }

                  return (
                    <tr
                      key={assignment.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-4 font-medium text-slate-800">
                        {schoolClass.name}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {schoolClass.level || "Not specified"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {subject.name}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
        <h2 className="font-semibold text-blue-950">
          Need to update your details?
        </h2>
        <p className="mt-2 text-sm leading-6 text-blue-900">
          Your personal information and teaching assignments are managed by your
          school. Please contact your school administrator to request changes.
        </p>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 break-words text-2xl font-bold text-slate-900">
        {value}
      </p>
    </article>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium text-slate-900">
        {value || "Not provided"}
      </p>
    </div>
  );
}
