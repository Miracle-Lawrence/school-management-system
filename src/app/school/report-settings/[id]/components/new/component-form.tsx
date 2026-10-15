"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createReportComponentAction,
  type ComponentFormState,
} from "./actions";

interface NewReportComponentFormProps {
  configurationId: number;
  categories: {
    id: number;
    name: string;
    type: string;
    displayOrder: number;
  }[];
}

const initialState: ComponentFormState = {
  error: null,
};

const assessmentTypes = [
  { value: "ASSIGNMENT", label: "Assignment" },
  { value: "TEST", label: "Test" },
  { value: "CA", label: "Continuous Assessment (CA)" },
  { value: "EXAM", label: "Examination" },
  { value: "PROJECT", label: "Project" },
  { value: "PRACTICAL", label: "Practical" },
  { value: "OTHER", label: "Other" },
] as const;

export default function NewReportComponentForm({
  configurationId,
  categories,
}: NewReportComponentFormProps) {
  const [componentType, setComponentType] = useState("ASSESSMENT");
  const [selectedAssessmentType, setSelectedAssessmentType] = useState("CA");

  const action = createReportComponentAction.bind(null, configurationId);

  const [state, formAction, isPending] = useActionState(action, initialState);

  const filteredCategories = categories
    .filter((category) => category.type === selectedAssessmentType)
    .sort(
      (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
    );

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <Link
          href={`/school/report-settings/${configurationId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to report configuration
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          Add Report Component
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Configure an assessment or calculated component for this report.
        </p>
      </div>

      <form
        action={formAction}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6"
      >
        {state.error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <div className="flex items-start gap-2">
              <span aria-hidden="true">⚠</span>
              <p>{state.error}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700"
          >
            Component Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={100}
            placeholder="e.g. First CA or Total CA"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="type"
            className="block text-sm font-medium text-slate-700"
          >
            Component Type
          </label>

          <select
            id="type"
            name="type"
            value={componentType}
            onChange={(event) => setComponentType(event.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ASSESSMENT">Assessment Component</option>
            <option value="CALCULATED">Calculated Component</option>
          </select>

          <p className="text-xs text-slate-500">
            Assessment components receive scores directly. Calculated components
            derive their scores from other components.
          </p>
        </div>

        {componentType === "ASSESSMENT" ? (
          <>
            <div className="space-y-2">
              <label
                htmlFor="assessmentType"
                className="block text-sm font-medium text-slate-700"
              >
                Assessment Type
              </label>

              <select
                id="assessmentType"
                name="assessmentType"
                value={selectedAssessmentType}
                onChange={(event) =>
                  setSelectedAssessmentType(event.target.value)
                }
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {assessmentTypes.map((assessmentType) => (
                  <option
                    key={assessmentType.value}
                    value={assessmentType.value}
                  >
                    {assessmentType.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="assessmentCategoryId"
                className="block text-sm font-medium text-slate-700"
              >
                Assessment Category
              </label>

              <select
                id="assessmentCategoryId"
                name="assessmentCategoryId"
                defaultValue=""
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">No category (legacy)</option>

                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <p className="text-xs text-slate-500">
                Categories are filtered by assessment type. Choose a category to
                link this report component to matching assessments, or leave it
                uncategorized for legacy assessments.
              </p>

              {filteredCategories.length === 0 && (
                <p className="text-xs text-amber-700">
                  No active categories are configured for this assessment type.
                  You can continue without a category or create one in your
                  assessment category settings.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="maxScore"
                className="block text-sm font-medium text-slate-700"
              >
                Maximum Score
              </label>

              <input
                id="maxScore"
                name="maxScore"
                type="number"
                min="0.01"
                step="0.01"
                required
                defaultValue="20"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <label
              htmlFor="aggregationType"
              className="block text-sm font-medium text-slate-700"
            >
              Calculation Method
            </label>

            <select
              id="aggregationType"
              name="aggregationType"
              required
              defaultValue="SUM"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="SUM">Sum of source components</option>
              <option value="AVERAGE">Average of source components</option>
            </select>

            <p className="text-xs text-slate-500">
              You will configure the source components and their weights after
              creating this component.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="displayOrder"
            className="block text-sm font-medium text-slate-700"
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
            defaultValue="1"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              name="isRequired"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300"
            />
            Required component
          </label>

          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              name="isVisible"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300"
            />
            Visible on report
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Link
            href={`/school/report-settings/${configurationId}`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Component"}
          </button>
        </div>
      </form>
    </main>
  );
}
