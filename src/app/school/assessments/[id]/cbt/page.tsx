import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { getAssessmentById } from "@/lib/services/assessment.service";
import CBTManagementClient from "@/app/teacher/assessments/[id]/cbt/cbt-management-client";

type SchoolCBTPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SchoolCBTPage({
  params,
}: SchoolCBTPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const assessmentId = Number(id);

  if (!Number.isSafeInteger(assessmentId) || assessmentId <= 0) {
    notFound();
  }

  const assessment = await getAssessmentById(
    schoolId,
    assessmentId,
  ).catch(() => notFound());

  const [schoolClass, subject, settings] = await Promise.all([
    db.orm.public.SchoolClass.where((item) =>
      item.id.eq(assessment.classId),
    ).first(),

    db.orm.public.Subject.where((item) =>
      item.id.eq(assessment.subjectId),
    ).first(),

    db.orm.public.CBTExamSettings.where((item) =>
      item.assessmentId.eq(assessmentId),
    ).first(),
  ]);

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
        href={`/school/assessments/${assessmentId}`}
        className="inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-900"
      >
        Back to assessment
      </Link>

      <section className="rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-900 p-6 text-white sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-200">
          Computer-based test management
        </p>

        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          {assessment.title}
        </h1>

        <p className="mt-2 text-blue-100">
          {schoolClass.name} · {subject.name}
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
        </div>
      </section>

      <CBTManagementClient
        assessmentId={assessment.id}
        assessmentTitle={assessment.title}
        maxScore={assessment.maxScore}
        initialSettingsConfigured={!!settings}
        initialStatus={settings?.status ?? null}
        questionBankHref="/school/cbt/question-banks"
      />
    </main>
  );
}

