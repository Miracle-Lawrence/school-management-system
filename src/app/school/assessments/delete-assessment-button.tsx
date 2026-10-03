"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteAssessmentButtonProps = {
  assessmentId: number;
  assessmentTitle: string;
};

export default function DeleteAssessmentButton({
  assessmentId,
  assessmentTitle,
}: DeleteAssessmentButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${assessmentTitle}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/school/assessments/${assessmentId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete assessment.");
      }

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="text-sm font-medium text-red-600 transition hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete"}
      </button>

      {error && (
        <p className="max-w-48 text-right text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
