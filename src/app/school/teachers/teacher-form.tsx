"use client";

import Link from "next/link";
import { useActionState } from "react";

type TeacherFormState = {
  error: string | null;
};

type TeacherFormProps = {
  action: (
    previousState: TeacherFormState,
    formData: FormData,
  ) => Promise<TeacherFormState>;
};

const initialState: TeacherFormState = {
  error: null,
};

export default function TeacherForm({ action }: TeacherFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Basic information */}
      <section className="border-b border-slate-200 p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-slate-900">
            Basic Information
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Enter the teacher's identification and name.
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
              htmlFor="employeeId"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Employee ID <span className="text-red-500">*</span>
            </label>

            <input
              id="employeeId"
              name="employeeId"
              type="text"
              required
              placeholder="e.g. TCH-001"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="firstName"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                First Name <span className="text-red-500">*</span>
              </label>

              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Last Name <span className="text-red-500">*</span>
              </label>

              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact information */}
      <section className="p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-slate-900">
            Contact Information
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Add the teacher's contact details.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="teacher@example.com"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Phone
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="08012345678"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
        <Link
          href="/school/teachers"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create Teacher"}
        </button>
      </div>
    </form>
  );
}
