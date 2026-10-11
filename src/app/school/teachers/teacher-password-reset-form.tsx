"use client";

import { useActionState } from "react";

export type TeacherPasswordResetState = {
  error: string | null;
  success: string | null;
};

type TeacherPasswordResetFormProps = {
  action: (
    previousState: TeacherPasswordResetState,
    formData: FormData,
  ) => Promise<TeacherPasswordResetState>;
};

const initialState: TeacherPasswordResetState = {
  error: null,
  success: null,
};

export default function TeacherPasswordResetForm({
  action,
}: TeacherPasswordResetFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="space-y-5 border-t border-slate-200 p-6 sm:p-8"
    >
      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {state.success}
        </div>
      )}

      <div>
        <label
          htmlFor="teacher-new-password"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          New Password
        </label>

        <input
          id="teacher-new-password"
          name="password"
          type="password"
          minLength={4}
          maxLength={128}
          required
          autoComplete="new-password"
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="Enter a new password"
        />

        <p className="mt-2 text-sm text-slate-500">
          Minimum 4 characters. Resetting the password signs the teacher out of
          existing sessions.
        </p>
      </div>

      <div className="flex justify-end border-t border-slate-200 pt-5">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Resetting Password..." : "Reset Password"}
        </button>
      </div>
    </form>
  );
}
