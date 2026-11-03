"use client";

import { useState, type FormEvent } from "react";

type ChangePasswordResult = {
  success: boolean;
  error?: string;
};

type ChangePasswordFormProps = {
  action: (formData: FormData) => Promise<ChangePasswordResult>;
  variant: "parent" | "student";
};

export function ChangePasswordForm({
  action,
  variant,
}: ChangePasswordFormProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isParent = variant === "parent";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    setError("");
    setIsSubmitting(true);

    try {
      const result = await action(new FormData(form));

      if (result.success) {
        // Force a fresh request on the current school's domain.
        window.location.assign("/login?passwordChanged=1");
        return;
      }

      setError(
        result.error ?? "Unable to change your password. Please try again.",
      );
      setIsSubmitting(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  const inputClass = isParent
    ? "w-full rounded-md border p-2"
    : "w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const labelClass = isParent
    ? "mb-1 block text-sm font-medium"
    : "mb-2 block text-sm font-semibold text-slate-800";

  const buttonClass = isParent
    ? "w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
    : "w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60";

  return (
    <form
      onSubmit={handleSubmit}
      className={isParent ? "space-y-4" : "space-y-5"}
    >
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div>
        <label htmlFor="password" className={labelClass}>
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={isSubmitting} className={buttonClass}>
        {isSubmitting
          ? "Changing password..."
          : isParent
            ? "Change password"
            : "Change Password"}
      </button>
    </form>
  );
}
