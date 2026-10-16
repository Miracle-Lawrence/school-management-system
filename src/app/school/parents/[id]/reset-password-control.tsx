"use client";

import { useActionState } from "react";

import { resetParentPasswordAction } from "./reset-password-action";

type ResetPasswordState = {
  error?: string;
  temporaryPassword?: string;
};

const initialState: ResetPasswordState = {};

export default function ResetPasswordControl({
  parentId,
}: {
  parentId: number;
}) {
  const [state, formAction, pending] = useActionState(
    resetParentPasswordAction,
    initialState,
  );

  return (
    <section className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Reset Parent Password
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Generate a temporary password for this parent. Their next login
          will require them to choose a new password.
        </p>
      </div>

      <form
        action={formAction}
        onSubmit={(event) => {
          if (
            !window.confirm(
              "Reset this parent's password? Their current sessions will be invalidated.",
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="parentId" value={parentId} />

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Resetting password..." : "Reset Password"}
        </button>
      </form>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}

      {state.temporaryPassword && (
        <div className="space-y-2 rounded-lg border border-amber-300 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">
            Temporary password
          </p>

          <code className="block break-all rounded bg-slate-100 p-3 text-sm text-slate-900">
            {state.temporaryPassword}
          </code>

          <p className="text-sm leading-5 text-slate-600">
            Communicate this password securely to the parent now. This
            temporary password is shown only in this response. The parent
            must change it after signing in.
          </p>
        </div>
      )}
    </section>
  );
}
