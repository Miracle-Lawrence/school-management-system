"use client";

import { useCallback, useEffect, useState } from "react";

type PaymentConfig = {
  provider: string;
  publicKey: string | null;
  hasSecretKey: boolean;
  isEnabled: boolean;
  lastValidatedAt: string | null;
};

export default function PaymentConfigForm() {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/school/payment-config", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load payment settings.");
      }

      setConfig(data.config);
      setPublicKey(data.config.publicKey || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load payment settings.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/school/payment-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicKey: publicKey.trim(),
          secretKey: secretKey.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save Paystack settings.");
      }

      setConfig(data.config);
      setPublicKey(data.config.publicKey || "");
      setSecretKey("");
      setMessage(data.message || "Paystack configuration saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save Paystack settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable() {
    const confirmed = window.confirm(
      "Are you sure you want to disable Paystack payments for this school?",
    );

    if (!confirmed) return;

    setDisabling(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/school/payment-config", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to disable Paystack.");
      }

      setConfig((current) =>
        current ? { ...current, isEnabled: false } : current,
      );
      setMessage(data.message || "Paystack has been disabled.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to disable Paystack.",
      );
    } finally {
      setDisabling(false);
    }
  }

  const environment = publicKey.startsWith("pk_test_")
    ? "Test mode"
    : publicKey.startsWith("pk_live_")
      ? "Live mode"
      : null;

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
        Loading payment configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Paystack Integration
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Receive online school fee payments through Paystack.
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              config?.isEnabled
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {config?.isEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Connection status
            </p>
            <p className="mt-2 font-semibold text-slate-900">
              {config?.hasSecretKey ? "Credentials saved" : "Not configured"}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Environment
            </p>
            <p className="mt-2 font-semibold text-slate-900">
              {environment || "Not detected"}
            </p>
          </div>
        </div>

        {config?.lastValidatedAt && (
          <p className="mt-4 text-xs text-slate-500">
            Last validated:{" "}
            {new Date(config.lastValidatedAt).toLocaleString()}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Paystack API Credentials
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Obtain your API keys from your Paystack dashboard. Your secret key
          is encrypted before it is stored and is never displayed here.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="paystack-public-key"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Public Key
            </label>
            <input
              id="paystack-public-key"
              type="text"
              value={publicKey}
              onChange={(event) => setPublicKey(event.target.value)}
              placeholder="pk_test_... or pk_live_..."
              autoComplete="off"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="paystack-secret-key"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Secret Key
            </label>
            <input
              id="paystack-secret-key"
              type="password"
              value={secretKey}
              onChange={(event) => setSecretKey(event.target.value)}
              placeholder={
                config?.hasSecretKey
                  ? "Enter your secret key again to update credentials"
                  : "sk_test_... or sk_live_..."
              }
              autoComplete="new-password"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {config?.hasSecretKey && (
              <p className="mt-2 text-xs text-slate-500">
                A secret key is already stored securely. Enter it again when
                saving your configuration; the existing key is never revealed.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            <strong>Important:</strong> Use matching public and secret keys
            from the same Paystack environment. Test keys are for testing;
            live keys are for actual payments.
          </div>

          <button
            type="submit"
            disabled={saving || !publicKey.trim() || !secretKey.trim()}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {saving ? "Validating and saving..." : "Validate and Save Credentials"}
          </button>
        </form>
      </section>

      {config?.hasSecretKey && (
        <section className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Disable Paystack
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            This prevents new payments from using this school's Paystack
            configuration. Your saved credentials will be retained.
          </p>

          <button
            type="button"
            onClick={handleDisable}
            disabled={disabling || !config.isEnabled}
            className="mt-4 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {disabling ? "Disabling..." : "Disable Paystack"}
          </button>
        </section>
      )}
    </div>
  );
}
