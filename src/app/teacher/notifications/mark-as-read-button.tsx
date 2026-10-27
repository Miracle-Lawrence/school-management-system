"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MarkAsReadButtonProps = {
  recipientId: number;
};

export default function MarkAsReadButton({
  recipientId,
}: MarkAsReadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleMarkAsRead() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/teacher/notifications/${recipientId}/read`,
        {
          method: "PATCH",
          headers: { Accept: "application/json" },
        },
      );

      const result: { error?: string } = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Unable to mark this notification as read.");
        return;
      }

      router.refresh();
      window.dispatchEvent(new Event("teacher-notifications-updated"));
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={handleMarkAsRead}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Updating..." : "Mark as read"}
      </button>

      {error ? (
        <p role="alert" className="mt-2 max-w-48 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
