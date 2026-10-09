"use client";

import { useActionState } from "react";

type TeacherEditFormState = {
  error: string | null;
};

type TeacherEditFormProps = {
  action: (
    previousState: TeacherEditFormState,
    formData: FormData,
  ) => Promise<TeacherEditFormState>;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const initialState: TeacherEditFormState = {
  error: null,
};

export default function TeacherEditForm({
  action,
  employeeId,
  firstName,
  lastName,
  email,
  phone,
}: TeacherEditFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="space-y-6 border-t border-slate-200 p-6 sm:p-8"
    >
      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {state.error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
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
            defaultValue={employeeId}
            required
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

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
            defaultValue={firstName}
            required
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            defaultValue={lastName}
            required
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

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
            defaultValue={email}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            defaultValue={phone}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
