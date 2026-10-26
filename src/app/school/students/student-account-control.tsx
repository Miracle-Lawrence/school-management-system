"use client";

import { useActionState, useState } from "react";

import {
  createStudentLoginAction,
  resetStudentPasswordAction,
  type StudentAccountActionState,
} from "./student-account-actions";

const initialState: StudentAccountActionState = {};

export default function StudentAccountControl({
  studentId,
  hasLogin,
  studentEmail,
}: {
  studentId: number;
  hasLogin: boolean;
  studentEmail: string | null;
}) {
  const [createState, createAction, creating] = useActionState(
    createStudentLoginAction,
    initialState,
  );

  const [resetState, resetAction, resetting] = useActionState(
    resetStudentPasswordAction,
    initialState,
  );

  const [createPassword, setCreatePassword] = useState("");
  const [createConfirmation, setCreateConfirmation] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmation, setResetConfirmation] = useState("");

  const loginExists = hasLogin || Boolean(createState.loginEmail);
  const temporaryPassword =
    resetState.temporaryPassword || createState.temporaryPassword;
  const loginEmail = resetState.loginEmail || createState.loginEmail;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="font-semibold text-slate-900">
          Student Login Account
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Create login credentials or choose a new password for the student.
          Passwords must contain exactly four characters.
        </p>
      </div>

      <div className="space-y-5 px-6 py-6">
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Account Status
          </p>
          <p className="mt-2 font-semibold text-slate-900">
            {loginExists ? "Login account linked" : "No login account"}
          </p>
          <p className="mt-1 break-words text-sm text-slate-600">
            Email: {loginEmail || studentEmail || "No email address provided"}
          </p>
        </div>

        {!loginExists ? (
          <div className="space-y-3">
            {!studentEmail?.trim() && (
              <p className="text-sm text-amber-800">
                Add an email address to the student's profile before creating
                a login account.
              </p>
            )}

            <form
              action={createAction}
              className="space-y-4"
              onSubmit={(event) => {
                if (createPassword !== createConfirmation) {
                  event.preventDefault();
                  return;
                }

                if (!window.confirm("Create a login account for this student?")) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="studentId" value={studentId} />

              <div>
                <label
                  htmlFor="create-student-password"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Choose a four-character password
                </label>
                <input
                  id="create-student-password"
                  name="password"
                  type="password"
                  required
                  minLength={4}
                  maxLength={4}
                  autoComplete="new-password"
                  value={createPassword}
                  onChange={(event) =>
                    setCreatePassword(event.target.value.slice(0, 4))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-create-student-password"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Confirm password
                </label>
                <input
                  id="confirm-create-student-password"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={4}
                  maxLength={4}
                  autoComplete="new-password"
                  value={createConfirmation}
                  onChange={(event) =>
                    setCreateConfirmation(event.target.value.slice(0, 4))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {createPassword.length === 4 &&
                createConfirmation.length === 4 &&
                createPassword !== createConfirmation && (
                  <p className="text-sm text-red-700">
                    The passwords do not match.
                  </p>
                )}

              <button
                type="submit"
                disabled={
                  creating ||
                  !studentEmail?.trim() ||
                  createPassword.length !== 4 ||
                  createConfirmation.length !== 4 ||
                  createPassword !== createConfirmation
                }
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? "Creating account..." : "Create Student Login"}
              </button>
            </form>

            {createState.error && (
              <p role="alert" className="text-sm font-medium text-red-700">
                {createState.error}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <form
              action={resetAction}
              className="space-y-4"
              onSubmit={(event) => {
                if (resetPassword !== resetConfirmation) {
                  event.preventDefault();
                  return;
                }

                if (
                  !window.confirm(
                    "Reset this student's password? Their current sessions will be invalidated.",
                  )
                ) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="studentId" value={studentId} />

              <div>
                <label
                  htmlFor="reset-student-password"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  New four-character password
                </label>
                <input
                  id="reset-student-password"
                  name="password"
                  type="password"
                  required
                  minLength={4}
                  maxLength={4}
                  autoComplete="new-password"
                  value={resetPassword}
                  onChange={(event) =>
                    setResetPassword(event.target.value.slice(0, 4))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-reset-student-password"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Confirm new password
                </label>
                <input
                  id="confirm-reset-student-password"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={4}
                  maxLength={4}
                  autoComplete="new-password"
                  value={resetConfirmation}
                  onChange={(event) =>
                    setResetConfirmation(event.target.value.slice(0, 4))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {resetPassword.length === 4 &&
                resetConfirmation.length === 4 &&
                resetPassword !== resetConfirmation && (
                  <p className="text-sm text-red-700">
                    The passwords do not match.
                  </p>
                )}

              <button
                type="submit"
                disabled={
                  resetting ||
                  resetPassword.length !== 4 ||
                  resetConfirmation.length !== 4 ||
                  resetPassword !== resetConfirmation
                }
                className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resetting ? "Resetting password..." : "Reset Student Password"}
              </button>
            </form>

            {resetState.error && (
              <p role="alert" className="text-sm font-medium text-red-700">
                {resetState.error}
              </p>
            )}
          </div>
        )}

        {temporaryPassword && (
          <div className="space-y-2 rounded-lg border border-emerald-300 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">
              Student Login Credentials
            </p>
            <p className="text-sm text-emerald-900">
              Login email: <strong>{loginEmail}</strong>
            </p>
            <code className="block break-all rounded-lg border border-emerald-200 bg-white p-3 text-sm text-slate-900">
              {temporaryPassword}
            </code>
            <p className="text-sm leading-6 text-emerald-900">
              Share these credentials securely. The student must change this
              password after signing in.
            </p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(
                  `Email: ${loginEmail}\nPassword: ${temporaryPassword}`,
                );
              }}
              className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
            >
              Copy Credentials
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
