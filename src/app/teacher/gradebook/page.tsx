import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import GradebookSelector from "./gradebook-selector";

export default async function TeacherGradebookPage() {
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

  const [allAssignments, classes, subjects, terms, sessions, configurations] =
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
      db.orm.public.ReportConfiguration.where((item) =>
        item.schoolId.eq(schoolId),
      ).all(),
    ]);

  // Only retain assignments belonging to this teacher's school.
  const assignments = allAssignments.filter(
    (item) => item.schoolId === schoolId,
  );

  const classById = new Map(classes.map((item) => [item.id, item]));
  const subjectById = new Map(subjects.map((item) => [item.id, item]));
  const sessionById = new Map(sessions.map((item) => [item.id, item]));

  // Build unique, valid class-subject combinations assigned to this teacher.
  const assignedPairs = assignments
    .map((assignment) => ({
      classId: assignment.classId,
      subjectId: assignment.subjectId,
    }))
    .filter(
      (pair) => classById.has(pair.classId) && subjectById.has(pair.subjectId),
    )
    .filter(
      (pair, index, pairs) =>
        pairs.findIndex(
          (item) =>
            item.classId === pair.classId && item.subjectId === pair.subjectId,
        ) === index,
    )
    .sort((a, b) => {
      const classA = classById.get(a.classId)?.name ?? "";
      const classB = classById.get(b.classId)?.name ?? "";

      return (
        classA.localeCompare(classB) ||
        (subjectById.get(a.subjectId)?.name ?? "").localeCompare(
          subjectById.get(b.subjectId)?.name ?? "",
        )
      );
    });

  // Only show terms belonging to this school's academic sessions.
  const validTerms = terms
    .filter((term) => sessionById.has(term.sessionId))
    .sort((a, b) => {
      const dateA = new Date(a.startDate.toString()).getTime();
      const dateB = new Date(b.startDate.toString()).getTime();

      return dateB - dateA;
    });

  const activeConfigurations = configurations.filter(
    (configuration) => configuration.isActive,
  );

  // Each report type should appear only once in the selector.
  const reportTypes = [
    ...new Set(
      activeConfigurations.map((configuration) => configuration.reportType),
    ),
  ].map((reportType) => ({
    value: reportType,
    label: reportType === "MID_TERM" ? "Mid-term" : "Terminal",
  }));

  return (
    <main className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-blue-600">
          Teaching &amp; Learning
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Teacher Gradebook
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Select an assigned class, subject, term, and report type to enter
          student assessment scores from one table.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Assigned class-subjects"
          value={assignedPairs.length}
        />

        <SummaryCard label="Available terms" value={validTerms.length} />

        <SummaryCard
          label="Active report configurations"
          value={activeConfigurations.length}
        />
      </section>

      <section>
        {assignedPairs.length === 0 ||
        validTerms.length === 0 ||
        reportTypes.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
            {assignedPairs.length === 0
              ? "You do not have any valid class-subject assignments yet. Please contact your school administrator."
              : validTerms.length === 0
                ? "No academic terms linked to your school's academic sessions were found."
                : "No active report configurations were found. Ask your school administrator to configure the reports before entering results."}
          </div>
        ) : (
          <GradebookSelector
            assignments={assignedPairs.map((pair) => ({
              classId: pair.classId,
              className: classById.get(pair.classId)!.name,
              subjectId: pair.subjectId,
              subjectName: subjectById.get(pair.subjectId)!.name,
            }))}
            terms={validTerms.map((term) => ({
              id: term.id,
              name: term.name,
              sessionName: sessionById.get(term.sessionId)!.name,
            }))}
            reportTypes={reportTypes}
          />
        )}
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <h2 className="font-semibold text-blue-950">
          How score entry will work
        </h2>

        <ul className="mt-3 space-y-2 text-sm leading-6 text-blue-900">
          <li>
            • One row per student, with columns for the configured assessments.
          </li>
          <li>• Existing scores will be displayed for editing.</li>
          <li>• Blank scores will remain unrecorded.</li>
          <li>• Scores will be validated against each assessment's maximum.</li>
          <li>
            • Your school's configured result-calculation rules will remain in
            use.
          </li>
        </ul>
      </section>
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
