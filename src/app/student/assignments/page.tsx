import { requireRole } from "@/lib/auth/authorization";
import { redirect } from "next/navigation";
import StudentAssignmentsClient from "./components/StudentAssignmentsClient";

export default async function StudentAssignmentsPage() {
  const session = await requireRole(["STUDENT"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (!Number.isInteger(userId) || !schoolId) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-blue-600">
          Student portal
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          My Assignments
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          View your assignments, submit your answers, and review your marks
          and teacher feedback.
        </p>
      </header>

      <StudentAssignmentsClient />
    </div>
  );
}
