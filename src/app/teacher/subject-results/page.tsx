import Link from "next/link";
import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

type SearchParams = {
  assignment?: string;
  termId?: string;
  reportType?: string;
};

type ReportType = "MID_TERM" | "TERMINAL";

function parseId(value?: string): number | null {
  if (!value) return null;

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseAssignment(value?: string) {
  if (!value) return null;

  const [classValue, subjectValue, extra] = value.split(":");

  if (extra !== undefined) return null;

  const classId = parseId(classValue);
  const subjectId = parseId(subjectValue);

  if (classId === null || subjectId === null) return null;

  return { classId, subjectId };
}

function formatScore(value: number | null | undefined) {
  return value == null ? "—" : Number(value).toFixed(2);
}

export default async function TeacherSubjectResultsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
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
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Your teacher profile is not configured correctly. Please contact your
        school administrator.
      </main>
    );
  }

  const [allAssignments, classes, subjects, allTerms, sessions] =
    await Promise.all([
      db.orm.public.TeacherAssignment.where((item) =>
        item.teacherId.eq(teacher.id),
      ).all(),

      db.orm.public.SchoolClass.where((item) =>
        item.schoolId.eq(schoolId),
      ).all(),

      db.orm.public.Subject.where((item) => item.schoolId.eq(schoolId)).all(),

      db.orm.public.Term.all(),

      db.orm.public.AcademicSession.where((item) =>
        item.schoolId.eq(schoolId),
      ).all(),
    ]);

  const assignments = allAssignments.filter(
    (item) => item.schoolId === schoolId,
  );

  const classById = new Map(classes.map((item) => [item.id, item]));
  const subjectById = new Map(subjects.map((item) => [item.id, item]));
  const sessionById = new Map(sessions.map((item) => [item.id, item]));

  // Only expose valid class-subject combinations assigned to this teacher.
  const assignedPairs = assignments
    .map((item) => ({
      classId: item.classId,
      subjectId: item.subjectId,
    }))
    .filter(
      (item) => classById.has(item.classId) && subjectById.has(item.subjectId),
    )
    .filter(
      (item, index, list) =>
        list.findIndex(
          (other) =>
            other.classId === item.classId &&
            other.subjectId === item.subjectId,
        ) === index,
    )
    .sort((a, b) => {
      const classComparison = (
        classById.get(a.classId)?.name ?? ""
      ).localeCompare(classById.get(b.classId)?.name ?? "");

      return (
        classComparison ||
        (subjectById.get(a.subjectId)?.name ?? "").localeCompare(
          subjectById.get(b.subjectId)?.name ?? "",
        )
      );
    });

  // Only terms belonging to this school's academic sessions are available.
  const validTerms = allTerms
    .filter((term) => sessionById.has(term.sessionId))
    .sort((a, b) => {
      const dateA = new Date(a.startDate.toString()).getTime();
      const dateB = new Date(b.startDate.toString()).getTime();

      return dateB - dateA;
    });

  const requestedAssignment = parseAssignment(params.assignment);

  const selectedAssignment =
    assignedPairs.find(
      (item) =>
        item.classId === requestedAssignment?.classId &&
        item.subjectId === requestedAssignment?.subjectId,
    ) ?? null;

  const activeSession = sessions.find((item) => item.isActive);

  const selectedTermId =
    validTerms.find((term) => term.id === parseId(params.termId))?.id ??
    validTerms.find((term) => term.isActive)?.id ??
    validTerms.find((term) => term.sessionId === activeSession?.id)?.id ??
    validTerms[0]?.id ??
    null;

  const reportType: ReportType =
    params.reportType === "MID_TERM" ? "MID_TERM" : "TERMINAL";

  const selectedClass = selectedAssignment
    ? (classById.get(selectedAssignment.classId) ?? null)
    : null;

  const selectedSubject = selectedAssignment
    ? (subjectById.get(selectedAssignment.subjectId) ?? null)
    : null;

  const selectedTerm = validTerms.find((term) => term.id === selectedTermId);

  // Load active students only for the selected class.
  const allStudents =
    selectedAssignment && selectedClass
      ? await db.orm.public.Student.where((item) =>
          item.schoolId.eq(schoolId),
        ).all()
      : [];

  const students = allStudents
    .filter(
      (student) =>
        student.classId === selectedAssignment?.classId && student.isActive,
    )
    .sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(
        `${b.lastName} ${b.firstName}`,
      ),
    );

  // Read saved results only. This page does not calculate or save results.
  const allSchoolResults =
    selectedAssignment && selectedTermId
      ? await db.orm.public.SubjectResult.where((item) =>
          item.schoolId.eq(schoolId),
        ).all()
      : [];

  const savedResults = allSchoolResults.filter(
    (result) =>
      result.classId === selectedAssignment?.classId &&
      result.subjectId === selectedAssignment?.subjectId &&
      result.termId === selectedTermId &&
      result.reportType === reportType,
  );

  const resultByStudent = new Map(
    savedResults.map((result) => [result.studentId, result]),
  );

  const compiledCount = students.filter((student) =>
    resultByStudent.has(student.id),
  ).length;

  const pendingCount = students.length - compiledCount;

  return (
    <main className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-blue-600">
          Teaching &amp; Learning
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Subject Results
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          View compiled results for students in your assigned classes. Results
          displayed here are read-only and are retrieved from saved records.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          method="GET"
          action="/teacher/subject-results"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <div>
            <label
              htmlFor="assignment"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Class and Subject
            </label>

            <select
              id="assignment"
              name="assignment"
              defaultValue={
                selectedAssignment
                  ? `${selectedAssignment.classId}:${selectedAssignment.subjectId}`
                  : ""
              }
              required
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
            >
              <option value="">Select class and subject</option>

              {assignedPairs.map((item) => (
                <option
                  key={`${item.classId}:${item.subjectId}`}
                  value={`${item.classId}:${item.subjectId}`}
                >
                  {classById.get(item.classId)?.name} —{" "}
                  {subjectById.get(item.subjectId)?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="termId"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Academic Term
            </label>

            <select
              id="termId"
              name="termId"
              defaultValue={selectedTermId ?? ""}
              required
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
            >
              <option value="">Select term</option>

              {validTerms.map((term) => (
                <option key={term.id} value={term.id}>
                  {sessionById.get(term.sessionId)?.name} — {term.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="reportType"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Report Type
            </label>

            <select
              id="reportType"
              name="reportType"
              defaultValue={reportType}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
            >
              <option value="MID_TERM">Mid-Term</option>
              <option value="TERMINAL">Terminal</option>
            </select>
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              View Results
            </button>
          </div>
        </form>
      </section>

      {assignedPairs.length === 0 ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          You do not have any valid class-subject assignments. Please contact
          your school administrator.
        </section>
      ) : validTerms.length === 0 ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          No academic terms linked to your school's academic sessions were
          found.
        </section>
      ) : !selectedAssignment || !selectedTerm ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Select an assigned class, subject, and academic term, then choose View
          Results.
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <SummaryCard label="Active students" value={students.length} />
            <SummaryCard label="Compiled results" value={compiledCount} />
            <SummaryCard label="Pending results" value={pendingCount} />
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selectedClass?.name} — {selectedSubject?.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {sessionById.get(selectedTerm.sessionId)?.name} ·{" "}
                    {selectedTerm.name} ·{" "}
                    {reportType === "MID_TERM" ? "Mid-Term" : "Terminal"}
                  </p>
                </div>

                <Link
                  href="/teacher/gradebook"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Open Gradebook
                </Link>
              </div>
            </div>

            {students.length === 0 ? (
              <p className="p-6 text-sm text-slate-600">
                There are no active students in this class.
              </p>
            ) : (
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="sticky top-0 z-20 border-b border-slate-200 bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-700">
                        S/N
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Student
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">
                        Total Score
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">
                        Percentage
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Grade
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Remark
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {students.map((student, index) => {
                      const result = resultByStudent.get(student.id);

                      return (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-500">
                            {index + 1}
                          </td>

                          <td className="px-4 py-3 font-medium text-slate-900">
                            {student.lastName} {student.firstName}
                          </td>

                          <td className="px-4 py-3 text-right tabular-nums">
                            {result ? formatScore(result.totalScore) : "—"}
                          </td>

                          <td className="px-4 py-3 text-right tabular-nums">
                            {result
                              ? `${formatScore(result.percentageScore)}%`
                              : "—"}
                          </td>

                          <td className="px-4 py-3">{result?.grade || "—"}</td>

                          <td className="px-4 py-3">{result?.remark || "—"}</td>

                          <td className="px-4 py-3">
                            {result ? (
                              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                                Compiled
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
              This page displays saved results only. It does not calculate,
              edit, or save student results.
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </article>
  );
}
