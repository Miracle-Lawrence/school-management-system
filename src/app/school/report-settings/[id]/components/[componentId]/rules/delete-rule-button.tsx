"use client";

import { useState } from "react";
import { deleteComponentRuleAction } from "./actions";

interface DeleteRuleButtonProps {
  configurationId: number;
  componentId: number;
  ruleId: number;
}

export default function DeleteRuleButton({
  configurationId,
  componentId,
  ruleId,
}: DeleteRuleButtonProps) {
  const [confirming, setConfirming] = useState(false);

  const deleteAction = deleteComponentRuleAction.bind(
    null,
    configurationId,
    componentId,
    ruleId,
  );

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <form action={deleteAction}>
          <button
            type="submit"
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            Confirm Delete
          </button>
        </form>

        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-sm font-medium text-red-600 hover:text-red-800"
    >
      Delete
    </button>
  );
}
