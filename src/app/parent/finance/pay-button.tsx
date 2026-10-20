"use client";

import { useState } from "react";

type InitializeResponse = {
  authorizationUrl?: string;
  error?: string;
};

export default function PayButton({ invoiceId }: { invoiceId: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/parent/payments/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceId }),
        cache: "no-store",
      });

      const result = (await response.json()) as InitializeResponse;

      if (!response.ok || !result.authorizationUrl) {
        setError(
          result.error ?? "Unable to start your payment. Please try again.",
        );
        setLoading(false);
        return;
      }

      // Navigate only to Paystack's hosted checkout URL.
      const checkoutUrl = new URL(result.authorizationUrl);

      if (
        checkoutUrl.protocol !== "https:" ||
        checkoutUrl.hostname !== "checkout.paystack.com"
      ) {
        setError("The payment provider returned an invalid checkout URL.");
        setLoading(false);
        return;
      }

      window.location.assign(checkoutUrl.toString());
    } catch {
      setError("A network error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-w-32">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Starting..." : "Pay now"}
      </button>

      {error && (
        <p
          className="mt-2 max-w-48 text-xs leading-5 text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
