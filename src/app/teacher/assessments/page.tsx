import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export default async function TeacherAssessmentsPage() {
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

  const assignments = await db.orm.public.TeacherAssignment.where((item) =>
    item.teacherId.eq(teacher.id),
  ).all();

  const validAssignments = assignments.filter(
    (assignment) => assignment.schoolId === schoolId,
  );

  const assignedPairs = new Set(
    validAssignments.map(
      (assignment) => `${assignment.classId}:${assignment.subjectId}`,
    ),
  );

  const [allAssessments, classes, subjects, terms, sessions] =
    await Promise.all([
      db.orm.public.Assessment.where((item) =>
        item.schoolId.eq(schoolId),
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

  const validTermIds = new Set(
    terms
      .filter((term) => sessions.some((item) => item.id === term.sessionId))
      .map((term) => term.id),
  );

  const assessments = allAssessments
    .filter(
      (assessment) =>
        assignedPairs.has(`${assessment.classId}:${assessment.subjectId}`) &&
        validTermIds.has(assessment.termId),
    )
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date.toString()).getTime() : 0;
      const dateB = b.date ? new Date(b.date.toString()).getTime() : 0;
      return dateB - dateA;
    });

  const classById = new Map(classes.map((item) => [item.id, item]));
  const subjectById = new Map(subjects.map((item) => [item.id, item]));
  const termById = new Map(terms.map((item) => [item.id, item]));
  const sessionById = new Map(sessions.map((item) => [item.id, item]));

  const pendingAssessmentCount = assessments.length;

  return (
    <main className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-blue-600">
          Teaching &amp; Learning
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          My Assessments
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          View school-configured assessments for your assigned classes and
          subjects. Open an assessment to enter or update student scores.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <SummaryCard label="Available assessments" value={assessments.length} />
        <SummaryCard
          label="Assigned class-subject combinations"
          value={assignedPairs.size}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {pendingAssessmentCount === 0 ? (
          <div className="px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              No assessments available
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
              Assessments will appear here when your school administrator
              configures them for a class and subject assigned to you.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {[
                    "Assessment",
                    "Class",
                    "Subject",
                    "Type",
                    "Term",
                    "Maximum score",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessments.map((assessment) => {
                  const schoolClass = classById.get(assessment.classId);
                  const subject = subjectById.get(assessment.subjectId);
                  const term = termById.get(assessment.termId);
                  const academicSession = term
                    ? sessionById.get(term.sessionId)
                    : undefined;

                  if (!schoolClass || !subject || !term || !academicSession) {
                    return null;
                  }

                  return (
                    <tr
                      key={assessment.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {assessment.title}
                        </p>
                        {assessment.date && (
                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(
                              assessment.date.toString(),
                            ).toLocaleDateString("en-GB", { timeZone: "UTC" })}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {schoolClass.name}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {subject.name}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {assessment.type.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        <p>{term.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {academicSession.name}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {assessment.maxScore}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/teacher/assessments/${assessment.id}`}
                          className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          Enter scores
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </article>
  );
}
