import { requireRole } from "@/lib/auth/authorization";
import { redirect } from "next/navigation";
import StudentCBTExamClient from "./components/StudentCBTExamClient";

type PageProps = {
  params: Promise<{ attemptId: string }>;
};

export default async function StudentCBTExamPage({ params }: PageProps) {
  const session = await requireRole(["STUDENT"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;
  const { attemptId } = await params;

  if (
    !Number.isSafeInteger(userId) ||
    !schoolId ||
    !/^\d+$/.test(attemptId) ||
    !Number.isSafeInteger(Number(attemptId)) ||
    Number(attemptId) <= 0
  ) {
    redirect("/student/cbt");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <StudentCBTExamClient attemptId={Number(attemptId)} />
    </div>
  );
}
