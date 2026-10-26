import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { redirect } from "next/navigation";

function formatDate(value: unknown): string {
  if (!value) return "—";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusStyle(status: string): string {
  switch (status) {
    case "PRESENT":
      return "bg-green-100 text-green-800";
    case "ABSENT":
      return "bg-red-100 text-red-800";
    case "LATE":
      return "bg-amber-100 text-amber-800";
    case "EXCUSED":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "PRESENT":
      return "Present";
    case "ABSENT":
      return "Absent";
    case "LATE":
      return "Late";
    case "EXCUSED":
      return "Excused";
    default:
      return status;
  }
}

export default async function StudentAttendancePage() {
  const session = await requireRole(["STUDENT"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (!Number.isInteger(userId) || !schoolId) {
    redirect("/login");
  }

  const student = await db.orm.public.Student.where(
    (item) => item.userId.eq(userId),
  ).first();

  if (!student || student.schoolId !== schoolId || !student.isActive) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold text-amber-900">
          Attendance unavailable
        </h1>
        <p className="mt-2 text-sm text-amber-800">
          Your student profile is not linked to an active school record.
          Please contact your school administrator.
        </p>
      </div>
    );
  }

  const attendanceRecords = await db.orm.public.Attendance.where(
    (item) => item.studentId.eq(student.id),
  ).all();

  const records = attendanceRecords
    .filter((record) => record.schoolId === schoolId)
    .sort(
      (a, b) =>
        new Date(String(b.date)).getTime() -
        new Date(String(a.date)).getTime(),
    );

  const presentCount = records.filter(
    (record) => record.status === "PRESENT",
  ).length;

  const absentCount = records.filter(
    (record) => record.status === "ABSENT",
  ).length;

  const lateCount = records.filter(
    (record) => record.status === "LATE",
  ).length;

  const excusedCount = records.filter(
    (record) => record.status === "EXCUSED",
  ).length;

  const attendanceRate =
    records.length > 0
      ? Math.round(((presentCount + lateCount) / records.length) * 100)
      : 0;

  const classIds = [...new Set(records.map((record) => record.classId))];
  const termIds = [...new Set(records.map((record) => record.termId))];

  const [classes, terms] = await Promise.all([
    Promise.all(
      classIds.map((id) =>
        db.orm.public.SchoolClass.where(
          (item) => item.id.eq(id),
        ).first(),
      ),
    ),
    Promise.all(
      termIds.map((id) =>
        db.orm.public.Term.where(
          (item) => item.id.eq(id),
        ).first(),
      ),
    ),
  ]);

  const classNames = new Map<number, string>();
  for (const schoolClass of classes) {
    if (schoolClass && schoolClass.schoolId === schoolId) {
      classNames.set(schoolClass.id, schoolClass.name);
    }
  }

  const termNames = new Map<number, string>();
  for (const term of terms) {
    if (term) {
      termNames.set(term.id, term.name);
    }
  }

  const summaryCards = [
    {
      label: "Days Recorded",
      value: records.length,
      description: "Attendance entries",
      style: "border-slate-200 bg-white",
      valueStyle: "text-slate-900",
    },
    {
      label: "Present",
      value: presentCount,
      description: "Marked present",
      style: "border-green-200 bg-green-50",
      valueStyle: "text-green-700",
    },
    {
      label: "Absent",
      value: absentCount,
      description: "Marked absent",
      style: "border-red-200 bg-red-50",
      valueStyle: "text-red-700",
    },
    {
      label: "Late",
      value: lateCount,
      description: "Late arrivals",
      style: "border-amber-200 bg-amber-50",
      valueStyle: "text-amber-700",
    },
  ];

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-blue-600">
          Student Portal
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          My Attendance
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          View your recorded attendance, absences, late arrivals, and
          attendance rate.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-5 shadow-sm ${card.style}`}
          >
            <p className="text-sm font-medium text-slate-600">
              {card.label}
            </p>
            <p className={`mt-3 text-3xl font-bold ${card.valueStyle}`}>
              {card.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {card.description}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Attendance Rate
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Based on the attendance records currently available.
            </p>
          </div>
          <p className="text-3xl font-bold text-blue-700">
            {attendanceRate}%
          </p>
        </div>

        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label="Attendance rate"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={attendanceRate}
        >
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${attendanceRate}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
          <span>Present: {presentCount}</span>
          <span>Absent: {absentCount}</span>
          <span>Late: {lateCount}</span>
          <span>Excused: {excusedCount}</span>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Excused absences are shown separately and are not counted as
          present. Late arrivals are included in this displayed rate.
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Attendance History
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your most recent recorded attendance appears first.
          </p>
        </div>

        {records.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              A
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              No attendance records yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Your attendance history will appear here when your school
              records it.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Class</th>
                  <th className="px-5 py-4 font-semibold">Term</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {classNames.get(record.classId) ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {termNames.get(record.termId) ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(record.status)}`}
                      >
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                    <td className="max-w-xs px-5 py-4 text-slate-600">
                      {record.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
