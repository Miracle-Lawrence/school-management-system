"use client";

import { useActionState } from "react";
import { updateComponentRuleAction } from "./actions";

interface EditRuleFormProps {
  configurationId: number;
  componentId: number;
  ruleId: number;
  currentWeight: number;
}

export default function EditRuleForm({
  configurationId,
  componentId,
  ruleId,
  currentWeight,
}: EditRuleFormProps) {
  const action = updateComponentRuleAction.bind(
    null,
    configurationId,
    componentId,
    ruleId,
  );

  const [state, formAction, isPending] = useActionState(action, {
    error: null,
  });

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        type="number"
        name="weight"
        min="0.01"
        max="100"
        step="0.01"
        defaultValue={currentWeight}
        required
        className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
        aria-label="Calculation rule weight"
      />

      <span className="text-sm text-slate-500">%</span>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save"}
      </button>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
