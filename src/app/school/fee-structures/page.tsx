import { requireRole } from "@/lib/auth/authorization";
import FeeStructureManager from "./fee-structure-manager";

export default async function FeeStructuresPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  if (!session.user.schoolId) {
    throw new Error("School context is required.");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">School Finance</p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Fee Structures
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Set the fees payable by each class for a particular academic session
          and term.
        </p>
      </div>

      <FeeStructureManager />
    </div>
  );
}
