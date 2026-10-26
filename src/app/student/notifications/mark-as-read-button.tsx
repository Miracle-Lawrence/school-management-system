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
        `/api/student/notifications/${recipientId}/read`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result: { error?: string } = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Unable to mark this notification as read.");
        return;
      }

      router.refresh();
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleMarkAsRead}
        disabled={loading}
        className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Updating..." : "Mark as read"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
