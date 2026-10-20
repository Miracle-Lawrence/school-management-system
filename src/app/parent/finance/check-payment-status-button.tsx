"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type VerifyResponse = {
  status?: "CONFIRMED" | "PENDING" | "FAILED";
  message?: string;
  error?: string;
};

export default function CheckPaymentStatusButton({
  reference,
}: {
  reference: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function checkStatus() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/parent/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reference }),
        cache: "no-store",
      });

      const result = (await response.json()) as VerifyResponse;

      if (response.status === 401) {
        setMessage(
          "Your session has expired. Please sign in again, then return here to check your payment.",
        );
        return;
      }

      if (result.status === "CONFIRMED") {
        setMessage("Payment confirmed successfully.");
        router.refresh();
        return;
      }

      if (result.status === "PENDING") {
        setMessage(
          result.message ??
            "Your payment is still being processed. Please check again shortly.",
        );
        return;
      }

      if (result.status === "FAILED") {
        setMessage(
          result.message ??
            "This payment was not completed. Refresh the page to see its updated status.",
        );
        router.refresh();
        return;
      }

      setMessage(
        result.error ??
          result.message ??
          "Unable to check the payment status. Please try again.",
      );
    } catch {
      setMessage(
        "A network error occurred. Please try checking the payment again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-w-36">
      <button
        type="button"
        onClick={checkStatus}
        disabled={loading}
        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-700 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Checking..." : "Check status"}
      </button>

      {message && (
        <p
          className="mt-2 max-w-56 whitespace-normal text-xs leading-5 text-slate-600"
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
