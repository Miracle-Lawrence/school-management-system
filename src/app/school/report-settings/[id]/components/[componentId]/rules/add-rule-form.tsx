"use client";

import { useActionState } from "react";
import {
  createComponentRuleAction,
  type ComponentRuleFormState,
} from "./actions";

interface AddRuleFormProps {
  configurationId: number;
  componentId: number;
  availableSources: {
    id: number;
    name: string;
  }[];
}

const initialState: ComponentRuleFormState = {
  error: null,
};

export default function AddRuleForm({
  configurationId,
  componentId,
  availableSources,
}: AddRuleFormProps) {
  const action = createComponentRuleAction.bind(
    null,
    configurationId,
    componentId,
  );

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="sourceComponentId"
          className="block text-sm font-medium text-slate-700"
        >
          Source Component
        </label>

        <select
          id="sourceComponentId"
          name="sourceComponentId"
          required
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a source component
          </option>

          {availableSources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="weight"
          className="block text-sm font-medium text-slate-700"
        >
          Contribution Weight (%)
        </label>

        <input
          id="weight"
          name="weight"
          type="number"
          min="0.01"
          max="100"
          step="0.01"
          required
          placeholder="e.g. 40"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Adding Rule..." : "Add Rule"}
      </button>
    </form>
  );
}
