import Link from "next/link";
import { requireRole } from "@/lib/auth/authorization";
import { getAssessmentCategories } from "@/lib/services/report-configuration.service";
import CategoryManager from "./category-manager";

export default async function AssessmentCategoriesPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const categories = await getAssessmentCategories(schoolId);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      <div>
        <Link
          href="/school/settings"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          ← Back to School Settings
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          Assessment Categories
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Manage reusable assessment categories for your school. Categories can
          be associated with report components to control which assessments
          contribute to calculated results.
        </p>
      </div>

      <CategoryManager categories={categories} />
    </main>
  );
}
