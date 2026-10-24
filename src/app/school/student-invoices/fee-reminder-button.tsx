"use client";

import { useState } from "react";

type FeeReminderResult = {
  invoicesChecked: number;
  remindersCreated: number;
  parentsNotified: number;
  skippedInvoices: number;
};

type ApiResponse = FeeReminderResult & {
  message?: string;
  error?: string;
};

export default function FeeReminderButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");

  async function sendReminders() {
    const confirmed = window.confirm(
      "Send fee reminders to the linked parent accounts for all eligible outstanding student invoices? Invoices already reminded will be skipped.",
    );

    if (!confirmed) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch("/api/school/fee-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        setError(data.error ?? "Unable to send fee reminders.");
        return;
      }

      setResult(data);
    } catch {
      setError(
        "A network error occurred. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-3 rounded-lg border p-4">
      <div>
        <h2 className="font-semibold">Outstanding Fee Reminders</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Notify linked parents about outstanding issued invoices. Each invoice
          is reminded only once in this version.
        </p>
      </div>

      <button
        type="button"
        onClick={sendReminders}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Sending reminders..." : "Send Fee Reminders"}
      </button>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {result && (
        <div
          role="status"
          aria-live="polite"
          className="space-y-1 rounded-md bg-muted p-3 text-sm"
        >
          <p className="font-medium">{result.message}</p>
          <p>Invoices checked: {result.invoicesChecked}</p>
          <p>Reminders created: {result.remindersCreated}</p>
          <p>Parents notified: {result.parentsNotified}</p>
          <p>Invoices skipped: {result.skippedInvoices}</p>
        </div>
      )}
    </section>
  );
}
