"use client";

import { useActionState } from "react";

type LoginState = {
  error?: string;
};

type SchoolLoginFormProps = {
  action: (
    previousState: LoginState,
    formData: FormData,
  ) => Promise<LoginState>;
  primaryColor: string;
};

const initialState: LoginState = {};

export default function SchoolLoginForm({
  action,
  primaryColor,
}: SchoolLoginFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <p className="font-semibold">Unable to sign in</p>
          <p className="mt-1">{state.error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Email Address
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:ring-2"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:ring-2"
          placeholder="Enter your password"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: primaryColor }}
      >
        {isPending ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
}
