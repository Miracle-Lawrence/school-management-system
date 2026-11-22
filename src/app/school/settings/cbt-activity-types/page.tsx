import { requireRole } from "@/lib/auth/authorization";
import Link from "next/link";
import CBTActivityTypeManager from "./activity-type-manager";

export default async function CBTActivityTypesPage() {
  await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-2 sm:px-4">
      <div>
        <Link
          href="/school/settings"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to School Settings
        </Link>

        <p className="mt-4 text-sm font-semibold text-blue-600">
          School Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          CBT Activity Types
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Create and manage the activity types used to classify Computer-Based
          Tests and examinations in your school.
        </p>
      </div>

      <CBTActivityTypeManager />
    </div>
  );
}
