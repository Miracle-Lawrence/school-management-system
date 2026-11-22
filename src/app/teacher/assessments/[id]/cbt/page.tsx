import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { getAssessmentById } from "@/lib/services/assessment.service";
import { getAssessmentCategories } from "@/lib/services/report-configuration.service";
import CBTManagementClient from "./cbt-management-client";

type TeacherCBTPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TeacherCBTPage({
  params,
}: TeacherCBTPageProps) {
  const session = await requireRole(["TEACHER"]);
  const schoolId = session.user.schoolId;
  const userId = Number(session.user.id);

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const assessmentId = Number(id);

  if (!Number.isSafeInteger(assessmentId) || assessmentId <= 0) {
    notFound();
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

  const assessment = await getAssessmentById(schoolId, assessmentId).catch(() =>
    notFound(),
  );

  const assignments = await db.orm.public.TeacherAssignment.where((item) =>
    item.teacherId.eq(teacher.id),
  ).all();

  const isAssigned = assignments.some(
    (assignment) =>
      assignment.schoolId === schoolId &&
      assignment.classId === assessment.classId &&
      assignment.subjectId === assessment.subjectId,
  );

  if (!isAssigned) {
    notFound();
  }

  const [schoolClass, subject, settings, categories] = await Promise.all([
    db.orm.public.SchoolClass.where((item) =>
      item.id.eq(assessment.classId),
    ).first(),

    db.orm.public.Subject.where((item) =>
      item.id.eq(assessment.subjectId),
    ).first(),

    db.orm.public.CBTExamSettings.where((item) =>
      item.assessmentId.eq(assessmentId),
    ).first(),

    getAssessmentCategories(schoolId),
  ]);

  const assessmentCategory = categories.find(
    (category) => category.id === assessment.assessmentCategoryId,
  );

  const automaticReportingReady = Boolean(
    assessmentCategory &&
    assessmentCategory.isActive &&
    assessmentCategory.type === assessment.type,
  );

  if (
    !schoolClass ||
    schoolClass.schoolId !== schoolId ||
    !subject ||
    subject.schoolId !== schoolId
  ) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <Link
        href={`/teacher/assessments/${assessmentId}`}
        className="inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-900"
      >
        ? Back to assessment
      </Link>

      <section className="rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-900 p-6 text-white sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-200">
          Computer-based test management
        </p>

        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          {assessment.title}
        </h1>

        <p className="mt-2 text-blue-100">
          {schoolClass.name} Â· {subject.name}
        </p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-lg bg-white/10 px-3 py-2">
            Maximum score: {assessment.maxScore}
          </span>

          <span className="rounded-lg bg-white/10 px-3 py-2">
            Type: {assessment.type.replaceAll("_", " ")}
          </span>

          <span className="rounded-lg bg-white/10 px-3 py-2">
            CBT status: {settings?.status ?? "Not configured"}
          </span>

          <span className="rounded-lg bg-white/10 px-3 py-2">
            Assessment category: {assessmentCategory?.name ?? "Not assigned"}
          </span>

          <span className="rounded-lg bg-white/10 px-3 py-2">
            Automatic reporting category: {automaticReportingReady ? "Ready" : "Needs attention"}
          </span>
        </div>
      </section>

      <CBTManagementClient
        assessmentId={assessment.id}
        assessmentTitle={assessment.title}
        maxScore={assessment.maxScore}
        initialSettingsConfigured={!!settings}
        initialStatus={settings?.status ?? null}
        questionBankHref="/teacher/cbt/question-banks"
      />
    </main>
  );
}




