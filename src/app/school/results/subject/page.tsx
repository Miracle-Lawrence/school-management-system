import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/prisma/db";
import { requireRole } from "@/lib/auth/authorization";

type SearchParams = {
  sessionId?: string;
  termId?: string;
  classId?: string;
  subjectId?: string;
  reportType?: string;
};

function parseId(value?: string) {
  if (!value) return null;

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function formatScore(value: number | null | undefined) {
  return value == null ? "—" : Number(value).toFixed(2);
}

export default async function SubjectResultsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    redirect("/login");
  }

  const requestedSessionId = parseId(params.sessionId);
  const requestedTermId = parseId(params.termId);
  const requestedClassId = parseId(params.classId);
  const requestedSubjectId = parseId(params.subjectId);

  const reportType = params.reportType === "MID_TERM" ? "MID_TERM" : "TERMINAL";

  // Load school sessions and classes.
  const [sessions, classes] = await Promise.all([
    db.orm.public.AcademicSession.where((item) =>
      item.schoolId.eq(schoolId),
    ).all(),

    db.orm.public.SchoolClass.where((item) => item.schoolId.eq(schoolId)).all(),
  ]);

  sessions.sort(
    (a, b) => Date.parse(String(b.startDate)) - Date.parse(String(a.startDate)),
  );

  classes.sort((a, b) => a.name.localeCompare(b.name));

  const activeSession = sessions.find((item) => item.isActive);

  const sessionId =
    sessions.find((item) => item.id === requestedSessionId)?.id ??
    activeSession?.id ??
    sessions[0]?.id ??
    null;

  // Load terms belonging to the selected academic session.
  const terms = sessionId
    ? await db.orm.public.Term.where((item) =>
        item.sessionId.eq(sessionId),
      ).all()
    : [];

  const termId =
    terms.find((item) => item.id === requestedTermId)?.id ??
    terms.find((item) => item.isActive)?.id ??
    terms[0]?.id ??
    null;

  // Resolve the selected class from the school's classes.
  const classId =
    classes.find((item) => item.id === requestedClassId)?.id ?? null;

  const selectedClass = classes.find((item) => item.id === classId);

  // Follow the same assignment-loading pattern used by NewAssessmentPage.
  const [allSubjects, assignments] = await Promise.all([
    db.orm.public.Subject.where((subject) =>
      subject.schoolId.eq(schoolId),
    ).all(),

    db.orm.public.ClassSubject.where((assignment) =>
      assignment.schoolId.eq(schoolId),
    ).all(),
  ]);

  // Identify subjects assigned to the selected class.
  const classAssignments = classId
    ? assignments.filter((assignment) => assignment.classId === classId)
    : [];

  const assignedSubjectIds = new Set(
    classAssignments.map((assignment) => assignment.subjectId),
  );

  const subjects = allSubjects
    .filter((subject) => assignedSubjectIds.has(subject.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const subjectId =
    subjects.find((item) => item.id === requestedSubjectId)?.id ?? null;

  const selectedSubject = subjects.find((item) => item.id === subjectId);

  // Load students in the selected class.
  const students =
    classId && selectedClass
      ? await db.orm.public.Student.where(
          (item) => item.schoolId.eq(schoolId) && item.classId.eq(classId),
        ).all()
      : [];

  students.sort((a, b) => {
    const nameA = `${a.lastName} ${a.firstName}`;
    const nameB = `${b.lastName} ${b.firstName}`;

    return nameA.localeCompare(nameB);
  });

  // Load report configuration for the selected report type.
  const configuration =
    termId && selectedSubject
      ? await db.orm.public.ReportConfiguration.where(
          (item) =>
            item.schoolId.eq(schoolId) && item.reportType.eq(reportType),
        ).first()
      : null;

  const components = configuration
    ? await db.orm.public.ReportComponent.where((item) =>
        item.configurationId.eq(configuration.id),
      ).all()
    : [];

  components.sort((a, b) => a.displayOrder - b.displayOrder);

  // Load previously saved results for this class, subject and term.
  const savedResults =
    termId && classId && subjectId
      ? await db.orm.public.SubjectResult.where(
          (item) =>
            item.schoolId.eq(schoolId) &&
            item.classId.eq(classId) &&
            item.subjectId.eq(subjectId) &&
            item.termId.eq(termId) &&
            item.reportType.eq(reportType),
        ).all()
      : [];

  const resultByStudent = new Map(
    savedResults.map((result) => [result.studentId, result]),
  );

  const componentScores =
    savedResults.length > 0
      ? await db.orm.public.ResultComponentScore.where((item) =>
          item.subjectResultId.in(savedResults.map((result) => result.id)),
        ).all()
      : [];

  const scoresByResult = new Map<number, typeof componentScores>();

  for (const score of componentScores) {
    const current = scoresByResult.get(score.subjectResultId) ?? [];

    current.push(score);

    scoresByResult.set(score.subjectResultId, current);
  }

  const canDisplayResults = Boolean(
    termId && classId && subjectId && selectedSubject,
  );

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Subject Results</h1>

          <p className="mt-1 text-sm text-gray-500">
            View student results and configured assessment components for a
            selected subject.
          </p>
        </div>

        <Link
          href="/school/results"
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Back to Results
        </Link>
      </div>

      <form
        method="GET"
        action="/school/results/subject"
        className="grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-3"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">
            Academic Session
          </label>

          <select
            name="sessionId"
            defaultValue={sessionId ?? ""}
            required
            className="w-full rounded-lg border p-2"
          >
            <option value="">Select session</option>

            {sessions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Term</label>

          <select
            name="termId"
            defaultValue={termId ?? ""}
            required
            className="w-full rounded-lg border p-2"
          >
            <option value="">Select term</option>

            {terms.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Class</label>

          <select
            name="classId"
            defaultValue={classId ?? ""}
            required
            className="w-full rounded-lg border p-2"
          >
            <option value="">Select class</option>

            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Report Type</label>

          <select
            name="reportType"
            defaultValue={reportType}
            className="w-full rounded-lg border p-2"
          >
            <option value="MID_TERM">Mid-Term</option>
            <option value="TERMINAL">Terminal</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Subject</label>

          <select
            name="subjectId"
            defaultValue={subjectId ?? ""}
            className="w-full rounded-lg border p-2"
            disabled={!classId || subjects.length === 0}
          >
            <option value="">Select subject</option>

            {subjects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Load Subject Results
          </button>
        </div>
      </form>

      {!classId && (
        <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
          Select a class and click Load Subject Results to load its assigned
          subjects.
        </div>
      )}

      {classId && subjects.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
          No subjects have been assigned to this class yet. Please assign
          subjects through Class Management before viewing results.
        </div>
      )}

      {canDisplayResults && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-sm text-gray-500">Class</p>
              <p className="mt-1 font-semibold">{selectedClass?.name}</p>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <p className="text-sm text-gray-500">Subject</p>
              <p className="mt-1 font-semibold">{selectedSubject?.name}</p>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <p className="text-sm text-gray-500">
                Students with saved results
              </p>

              <p className="mt-1 text-2xl font-bold">
                {
                  students.filter((student) => resultByStudent.has(student.id))
                    .length
                }{" "}
                / {students.length}
              </p>
            </div>
          </div>

          {!configuration && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              No report configuration was found for this report type. Configure
              the report components before calculating results.
            </div>
          )}

          {configuration && components.length === 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              The report configuration has no components.
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border bg-white">
            <div className="border-b p-4">
              <h2 className="font-semibold">Student Subject Scores</h2>

              <p className="mt-1 text-sm text-gray-500">
                Saved scores are displayed below. Calculation and editing
                actions will be added separately.
              </p>
            </div>

            <table className="w-full min-w-max text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Admission No.</th>

                  {components
                    .filter((component) => component.isVisible)
                    .map((component) => (
                      <th key={component.id} className="px-4 py-3 text-center">
                        {component.name}
                      </th>
                    ))}

                  <th className="px-4 py-3 text-center">Total</th>
                  <th className="px-4 py-3 text-center">Grade</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => {
                  const result = resultByStudent.get(student.id);

                  const studentScores = result
                    ? (scoresByResult.get(result.id) ?? [])
                    : [];

                  return (
                    <tr key={student.id} className="border-t">
                      <td className="px-4 py-3 font-medium">
                        {student.lastName} {student.firstName}{" "}
                        {student.middleName ?? ""}
                      </td>

                      <td className="px-4 py-3">{student.admissionNumber}</td>

                      {components
                        .filter((component) => component.isVisible)
                        .map((component) => {
                          const score = studentScores.find(
                            (item) => item.componentId === component.id,
                          );

                          return (
                            <td
                              key={component.id}
                              className="px-4 py-3 text-center"
                            >
                              {score ? formatScore(score.score) : "—"}

                              {score?.maxScore != null && (
                                <span className="text-gray-400">
                                  {" "}
                                  / {formatScore(score.maxScore)}
                                </span>
                              )}
                            </td>
                          );
                        })}

                      <td className="px-4 py-3 text-center font-semibold">
                        {result ? formatScore(result.totalScore) : "—"}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {result?.grade ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {result ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                            Calculated
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {students.length === 0 && (
                  <tr>
                    <td
                      colSpan={
                        components.filter((component) => component.isVisible)
                          .length + 5
                      }
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      No students are currently enrolled in this class.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
