"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  updateReportComponentAction,
  type UpdateComponentFormState,
} from "./actions";

type AssessmentType =
  "ASSIGNMENT" | "TEST" | "CA" | "EXAM" | "PROJECT" | "PRACTICAL" | "OTHER";

interface AssessmentCategoryOption {
  id: number;
  name: string;
  type: AssessmentType;
  displayOrder: number;
}

interface EditReportComponentFormProps {
  configurationId: number;
  categories: AssessmentCategoryOption[];
  component: {
    id: number;
    name: string;
    assessmentType: string | null;
    assessmentCategoryId: number | null;
    maxScore: number | null;
    displayOrder: number;
    isRequired: boolean;
    isVisible: boolean;
  };
}

const initialState: UpdateComponentFormState = {
  error: null,
};

const assessmentTypes: {
  value: AssessmentType;
  label: string;
}[] = [
  { value: "ASSIGNMENT", label: "Assignment" },
  { value: "TEST", label: "Test" },
  { value: "CA", label: "Continuous Assessment (CA)" },
  { value: "EXAM", label: "Examination" },
  { value: "PROJECT", label: "Project" },
  { value: "PRACTICAL", label: "Practical" },
  { value: "OTHER", label: "Other" },
];

export default function EditReportComponentForm({
  configurationId,
  categories,
  component,
}: EditReportComponentFormProps) {
  const initialAssessmentType: AssessmentType = assessmentTypes.some(
    (item) => item.value === component.assessmentType,
  )
    ? (component.assessmentType as AssessmentType)
    : "CA";

  const [selectedAssessmentType, setSelectedAssessmentType] =
    useState<AssessmentType>(initialAssessmentType);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    component.assessmentCategoryId == null
      ? ""
      : String(component.assessmentCategoryId),
  );

  const filteredCategories = categories
    .filter((category) => category.type === selectedAssessmentType)
    .sort(
      (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
    );

  const updateAction = updateReportComponentAction.bind(
    null,
    configurationId,
    component.id,
  );

  const [state, formAction, isPending] = useActionState(
    updateAction,
    initialState,
  );

  function handleAssessmentTypeChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const nextType = event.target.value as AssessmentType;

    setSelectedAssessmentType(nextType);

    // Keep the selected category only if it belongs to the new type.
    const selectedCategory = categories.find(
      (category) => String(category.id) === selectedCategoryId,
    );

    if (selectedCategory && selectedCategory.type !== nextType) {
      setSelectedCategoryId("");
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Link
          href={`/school/report-settings/${configurationId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Report Configuration
        </Link>

        <h1 className="mt-4 text-2xl font-bold">Edit Assessment Component</h1>

        <p className="mt-2 text-sm text-slate-600">
          Update the assessment component settings for this report.
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        {state.error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {state.error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Component Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={100}
            defaultValue={component.name}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="assessmentType"
            className="mb-1 block text-sm font-medium"
          >
            Assessment Type
          </label>

          <select
            id="assessmentType"
            name="assessmentType"
            required
            value={selectedAssessmentType}
            onChange={handleAssessmentTypeChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {assessmentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="assessmentCategoryId"
            className="mb-1 block text-sm font-medium"
          >
            Assessment Category
          </label>

          <select
            id="assessmentCategoryId"
            name="assessmentCategoryId"
            value={selectedCategoryId}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">No category (legacy)</option>

            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <p className="mt-1 text-xs text-slate-500">
            Choose a category matching the assessment type. The uncategorized
            option is retained for legacy assessments.
          </p>

          {filteredCategories.length === 0 && (
            <p className="mt-1 text-xs text-amber-700">
              No active categories are available for this assessment type. You
              can keep this component uncategorized or create a category in your
              assessment settings.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="maxScore" className="mb-1 block text-sm font-medium">
            Maximum Score
          </label>

          <input
            id="maxScore"
            name="maxScore"
            type="number"
            min="0.01"
            step="0.01"
            required
            defaultValue={component.maxScore ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="displayOrder"
            className="mb-1 block text-sm font-medium"
          >
            Display Order
          </label>

          <input
            id="displayOrder"
            name="displayOrder"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={component.displayOrder}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isRequired"
              defaultChecked={component.isRequired}
              className="h-4 w-4"
            />
            Required component
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isVisible"
              defaultChecked={component.isVisible}
              className="h-4 w-4"
            />
            Visible on student reports
          </label>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving Changes..." : "Save Changes"}
          </button>

          <Link
            href={`/school/report-settings/${configurationId}`}
            className="rounded-md border border-slate-300 px-5 py-2 text-sm hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
