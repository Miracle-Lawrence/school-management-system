"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type PaymentState = "verifying" | "confirmed" | "pending" | "failed" | "error";

type VerificationResponse = {
  status?: string;
  message?: string;
  error?: string;
  reference?: string;
};

export default function PaymentCallbackClient({
  reference,
}: {
  reference: string;
}) {
  const [state, setState] = useState<PaymentState>(
    reference ? "verifying" : "error",
  );
  const [message, setMessage] = useState(
    reference
      ? "Checking your transaction directly with Paystack..."
      : "No transaction reference was provided.",
  );

  const initialVerificationStarted = useRef(false);

  const verifyPayment = useCallback(async () => {
    if (!reference) {
      setState("error");
      setMessage("No transaction reference was provided.");
      return;
    }

    setState("verifying");
    setMessage("Checking your transaction directly with Paystack...");

    try {
      const response = await fetch("/api/parent/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ reference }),
      });

      const result = (await response.json()) as VerificationResponse;

      if (result.status === "CONFIRMED") {
        setState("confirmed");
        setMessage("Your payment has been verified and recorded successfully.");
        return;
      }

      if (result.status === "PENDING") {
        setState("pending");
        setMessage(
          result.message ??
            "Your payment is still being processed. You can check again shortly.",
        );
        return;
      }

      if (result.status === "FAILED") {
        setState("failed");
        setMessage(
          result.message ?? "The payment was not completed successfully.",
        );
        return;
      }

      setState("error");
      setMessage(
        result.error ??
          "We could not verify this transaction. Please try again.",
      );
    } catch {
      setState("error");
      setMessage(
        "We could not reach the verification service. Check your connection and try again.",
      );
    }
  }, [reference]);

  useEffect(() => {
    if (initialVerificationStarted.current) return;

    initialVerificationStarted.current = true;
    void verifyPayment();
  }, [verifyPayment]);

  const isConfirmed = state === "confirmed";
  const isPending = state === "pending";
  const isFailed = state === "failed";
  const isVerifying = state === "verifying";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center p-4 sm:p-6">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div
          className={`mb-5 flex size-14 items-center justify-center rounded-full text-2xl ${
            isConfirmed
              ? "bg-emerald-100 text-emerald-700"
              : isFailed
                ? "bg-red-100 text-red-700"
                : isPending
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700"
          }`}
          aria-hidden="true"
        >
          {isConfirmed ? "✓" : isFailed ? "!" : isPending ? "…" : "↻"}
        </div>

        <p className="text-sm font-semibold text-blue-700">
          Parent portal · Online payments
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {isConfirmed
            ? "Payment confirmed"
            : isFailed
              ? "Payment unsuccessful"
              : isPending
                ? "Payment processing"
                : isVerifying
                  ? "Verifying payment"
                  : "Unable to confirm payment"}
        </h1>

        <p
          className="mt-3 text-sm leading-6 text-slate-600"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>

        {reference && (
          <div className="mt-5 rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">
              Transaction reference
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-slate-800">
              {reference}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {(isPending || state === "error") && reference && (
            <button
              type="button"
              onClick={() => void verifyPayment()}
              disabled={isVerifying}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isVerifying ? "Checking..." : "Check payment again"}
            </button>
          )}

          <Link
            href="/parent/finance"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Return to school fees
          </Link>
        </div>

        {(isPending || isFailed || state === "error") && (
          <p className="mt-5 text-xs leading-5 text-slate-500">
            If your account was charged, do not immediately make another
            payment. Check the transaction again or contact your school
            administrator with the reference above.
          </p>
        )}
      </section>
    </main>
  );
}
