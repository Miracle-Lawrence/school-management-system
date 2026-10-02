"use client";

import { useActionState } from "react";

import {
  deleteReportComponentAction,
  type DeleteComponentFormState,
} from "./actions";

interface DeleteComponentFormProps {
  configurationId: number;
  componentId: number;
  componentName: string;
}

const initialState: DeleteComponentFormState = {
  error: null,
};

export default function DeleteComponentForm({
  configurationId,
  componentId,
  componentName,
}: DeleteComponentFormProps) {
  const deleteAction = deleteReportComponentAction.bind(
    null,
    configurationId,
    componentId,
  );

  const [state, formAction, isPending] = useActionState(
    deleteAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="confirmation"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Type DELETE to confirm removal of "{componentName}"
        </label>

        <input
          id="confirmation"
          name="confirmation"
          type="text"
          required
          autoComplete="off"
          placeholder="Type DELETE"
          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-red-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Deleting Component..." : "Delete Component"}
      </button>
    </form>
  );
}
