"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  updateReportComponentAction,
  type UpdateComponentFormState,
} from "./actions";

interface EditReportComponentFormProps {
  configurationId: number;
  component: {
    id: number;
    name: string;
    assessmentType: string | null;
    maxScore: number | null;
    displayOrder: number;
    isRequired: boolean;
    isVisible: boolean;
  };
}

const initialState: UpdateComponentFormState = {
  error: null,
};

export default function EditReportComponentForm({
  configurationId,
  component,
}: EditReportComponentFormProps) {
  const updateAction = updateReportComponentAction.bind(
    null,
    configurationId,
    component.id,
  );

  const [state, formAction, isPending] = useActionState(
    updateAction,
    initialState,
  );

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
            defaultValue={component.assessmentType ?? "CA"}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="ASSIGNMENT">Assignment</option>
            <option value="TEST">Test</option>
            <option value="CA">Continuous Assessment (CA)</option>
            <option value="EXAM">Examination</option>
            <option value="PROJECT">Project</option>
            <option value="PRACTICAL">Practical</option>
            <option value="OTHER">Other</option>
          </select>
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
