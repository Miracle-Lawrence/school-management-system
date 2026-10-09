"use client";

import Link from "next/link";
import { useActionState } from "react";

type AcademicSessionFormState = {
  error: string | null;
};

type AcademicSessionFormProps = {
  action: (
    previousState: AcademicSessionFormState,
    formData: FormData,
  ) => Promise<AcademicSessionFormState>;
  initialName?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  cancelHref: string;
  submitLabel: string;
};

const initialState: AcademicSessionFormState = {
  error: null,
};

export default function AcademicSessionForm({
  action,
  initialName = "",
  initialStartDate = "",
  initialEndDate = "",
  cancelHref,
  submitLabel,
}: AcademicSessionFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <section className="p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-slate-900">
            Session Information
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Enter the academic session name and its start and end dates.
          </p>
        </div>

        {state.error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {state.error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Session Name <span className="text-red-500">*</span>
            </label>

            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={initialName}
              placeholder="e.g. 2026/2027"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-2 text-xs text-slate-500">
              Use a clear name such as 2026/2027.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="startDate"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Start Date <span className="text-red-500">*</span>
              </label>

              <input
                id="startDate"
                name="startDate"
                type="date"
                required
                defaultValue={initialStartDate}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                End Date <span className="text-red-500">*</span>
              </label>

              <input
                id="endDate"
                name="endDate"
                type="date"
                required
                defaultValue={initialEndDate}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
        <Link
          href={cancelHref}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
