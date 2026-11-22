import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import CBTQuestionBankManager from "@/components/cbt-question-bank-manager";

export default async function SchoolQuestionBanksPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const subjectRecords = await db.orm.public.Subject.where((subject) =>
    subject.schoolId.eq(schoolId),
  ).all();

  const subjects = subjectRecords.map((subject) => ({
    id: subject.id,
    name: subject.name,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-2 sm:px-4">
      <div>
        <Link
          href="/school/assessments"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to Assessments
        </Link>

        <p className="mt-4 text-sm font-semibold text-blue-600">
          School Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          CBT Question Banks
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Create and manage question banks for your school subjects. You can
          organize questions by subject and reuse them when preparing CBT
          examinations.
        </p>
      </div>

      <CBTQuestionBankManager subjects={subjects} />
    </div>
  );
}
