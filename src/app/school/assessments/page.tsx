import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";

import {
  getAssessments,
  getAssessmentScores,
} from "@/lib/services/assessment.service";

import DeleteAssessmentButton from "./delete-assessment-button";

import { db } from "@/prisma/db";

export default async function AssessmentsPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const assessments = await getAssessments({ schoolId });

  const assessmentsWithProgress = await Promise.all(
    assessments.map(async (assessment) => {
      const [classStudents, scores, schoolClass, subject] = await Promise.all([
        db.orm.public.Student.where((student) =>
          student.classId.eq(assessment.classId),
        ).all(),

        getAssessmentScores(schoolId, assessment.id),

        db.orm.public.SchoolClass.where((schoolClass) =>
          schoolClass.id.eq(assessment.classId),
        ).first(),

        db.orm.public.Subject.where((subject) =>
          subject.id.eq(assessment.subjectId),
        ).first(),
      ]);

      const totalStudents = classStudents.filter(
        (student) => student.schoolId === schoolId,
      ).length;

      const graded = scores.length;
      const pending = Math.max(0, totalStudents - graded);

      const completion =
        totalStudents > 0 ? Math.round((graded / totalStudents) * 100) : 0;

      const status =
        totalStudents === 0
          ? "No Students"
          : graded === 0
            ? "Not Started"
            : graded >= totalStudents
              ? "Completed"
              : "In Progress";

      return {
        ...assessment,
        className: schoolClass?.name ?? "Unknown Class",
        subjectName: subject?.name ?? "Unknown Subject",
        totalStudents,
        graded,
        pending,
        completion,
        status,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assessments</h1>

          <p className="mt-1 text-sm text-slate-500">
            Create and manage class assessments and student scores.
          </p>
        </div>

        <Link
          href="/school/assessments/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Create Assessment
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Total Assessments</p>

        <p className="mt-2 text-3xl font-bold text-slate-900">
          {assessments.length}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Assessment Records</h2>
        </div>

        {assessments.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              No assessments yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Create your first assessment to begin recording student scores.
            </p>

            <Link
              href="/school/assessments/new"
              className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Create First Assessment
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assessment
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Maximum Score
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Weight
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Students
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Graded
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Pending
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Progress
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {assessmentsWithProgress.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {assessment.title}
                      </p>

                      <p className="mt-1 text-sm font-medium text-blue-700">
                        {assessment.className} · {assessment.subjectName}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {assessment.type.replaceAll("_", " ")}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {assessment.maxScore}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {assessment.weight}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {assessment.totalStudents}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-green-600">
                      {assessment.graded}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-orange-600">
                      {assessment.pending}
                    </td>

                    <td className="min-w-36 px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{
                              width: `${assessment.completion}%`,
                            }}
                          />
                        </div>

                        <span className="text-xs font-medium text-slate-600">
                          {assessment.completion}%
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          assessment.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : assessment.status === "In Progress"
                              ? "bg-blue-100 text-blue-700"
                              : assessment.status === "Not Started"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {assessment.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/school/assessments/${assessment.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </Link>

                        <DeleteAssessmentButton
                          assessmentId={assessment.id}
                          assessmentTitle={assessment.title}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
