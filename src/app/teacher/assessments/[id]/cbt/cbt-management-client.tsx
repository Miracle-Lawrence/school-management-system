"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type CBTManagementClientProps = {
  assessmentId: number;
  assessmentTitle: string;
  maxScore: number;
  initialSettingsConfigured: boolean;
  initialStatus: string | null;
  questionBankHref: string;
};

type ActivityType = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
};

type ReportMode = "AUTOMATIC" | "MANUAL" | "EXCLUDED";

type CBTSettings = {
  activityTypeId: number | null;
  reportMode: ReportMode;
  status: string;
  durationMinutes: number;
  opensAt: string | null;
  closesAt: string | null;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowBackNavigation: boolean;
  instructions: string | null;
};

type SettingsForm = {
  activityTypeId: string;
  reportMode: ReportMode;
  durationMinutes: string;
  opensAt: string;
  closesAt: string;
  maxAttempts: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowBackNavigation: boolean;
  instructions: string;
};

const defaultForm: SettingsForm = {
  activityTypeId: "",
  reportMode: "AUTOMATIC",
  durationMinutes: "60",
  opensAt: "",
  closesAt: "",
  maxAttempts: "1",
  shuffleQuestions: false,
  shuffleOptions: false,
  allowBackNavigation: true,
  instructions: "",
};

function toLocalDateTime(value: string | null | undefined): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toISOStringOrNull(value: string): string | null {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Please provide valid opening and closing dates.");
  }

  return date.toISOString();
}

export default function CBTManagementClient({
  assessmentId,
  assessmentTitle,
  maxScore,
  initialSettingsConfigured,
  initialStatus,
  questionBankHref,
}: CBTManagementClientProps) {
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [form, setForm] = useState<SettingsForm>(defaultForm);
  const [settingsConfigured, setSettingsConfigured] = useState(
    initialSettingsConfigured,
  );
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const settingsUrl = `/api/school/cbt/assessments/${assessmentId}/settings`;

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [activityResponse, settingsResponse] = await Promise.all([
          fetch("/api/school/cbt/activity-types", {
            cache: "no-store",
          }),
          fetch(settingsUrl, {
            cache: "no-store",
          }),
        ]);

        const activityData = await activityResponse.json();

        if (!activityResponse.ok) {
          throw new Error(
            activityData.error || "Unable to load CBT activity types.",
          );
        }

        const loadedActivityTypes = Array.isArray(activityData.activityTypes)
          ? activityData.activityTypes
          : [];

        if (!cancelled) {
          setActivityTypes(loadedActivityTypes);
        }

        if (settingsResponse.status === 404) {
          if (!cancelled) {
            setSettingsConfigured(false);
            setStatus(null);
            setForm(defaultForm);
          }
          return;
        }

        const settingsData = await settingsResponse.json();

        if (!settingsResponse.ok) {
          throw new Error(
            settingsData.error || "Unable to load CBT settings.",
          );
        }

        const settings = settingsData.settings as CBTSettings;

        if (!cancelled) {
          setSettingsConfigured(true);
          setStatus(settings.status);
          setForm({
            activityTypeId: settings.activityTypeId
              ? String(settings.activityTypeId)
              : "",
            reportMode: settings.reportMode,
            durationMinutes: String(settings.durationMinutes),
            opensAt: toLocalDateTime(settings.opensAt),
            closesAt: toLocalDateTime(settings.closesAt),
            maxAttempts: String(settings.maxAttempts),
            shuffleQuestions: settings.shuffleQuestions,
            shuffleOptions: settings.shuffleOptions,
            allowBackNavigation: settings.allowBackNavigation,
            instructions: settings.instructions ?? "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load CBT management data.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [settingsUrl]);

  function updateField<K extends keyof SettingsForm>(
    field: K,
    value: SettingsForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const durationMinutes = Number(form.durationMinutes);
    const maxAttempts = Number(form.maxAttempts);

    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 600
    ) {
      setError("Duration must be between 1 and 600 minutes.");
      return;
    }

    if (
      !Number.isInteger(maxAttempts) ||
      maxAttempts < 1 ||
      maxAttempts > 20
    ) {
      setError("Maximum attempts must be between 1 and 20.");
      return;
    }

    if (form.opensAt && form.closesAt) {
      if (new Date(form.opensAt).getTime() >= new Date(form.closesAt).getTime()) {
        setError("The closing date must be after the opening date.");
        return;
      }
    }

    let opensAt: string | null;
    let closesAt: string | null;

    try {
      opensAt = toISOStringOrNull(form.opensAt);
      closesAt = toISOStringOrNull(form.closesAt);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid schedule dates.",
      );
      return;
    }

    const payload = {
      activityTypeId: form.activityTypeId
        ? Number(form.activityTypeId)
        : null,
      reportMode: form.reportMode,
      durationMinutes,
      opensAt,
      closesAt,
      maxAttempts,
      shuffleQuestions: form.shuffleQuestions,
      shuffleOptions: form.shuffleOptions,
      allowBackNavigation: form.allowBackNavigation,
      instructions: form.instructions.trim() || null,
    };

    setSaving(true);

    try {
      const response = await fetch(settingsUrl, {
        method: settingsConfigured ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save CBT settings.");
      }

      setSettingsConfigured(true);
      setStatus(data.settings?.status ?? status);
      setSuccess(data.message || "CBT settings saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save CBT settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  const activeActivityTypes = activityTypes.filter(
    (activityType) => activityType.isActive,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          CBT Management
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Configure the examination, manage question banks, publish questions,
          and review student results.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Assessment</p>
            <p className="mt-1 font-medium text-gray-900">
              {assessmentTitle}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Maximum Score</p>
            <p className="mt-1 font-medium text-gray-900">{maxScore}</p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">CBT Status</p>
            <p className="mt-1 font-medium text-gray-900">
              {status ?? (settingsConfigured ? "Configured" : "Not configured")}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href={questionBankHref}
            className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Manage Question Banks
          </Link>
          <p className="text-xs text-gray-500">
            Assessment ID: {assessmentId}
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Examination Settings
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Configure how students will take this CBT examination.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading CBT settings...</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
              >
                {success}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="activityTypeId"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  CBT Activity Type
                </label>
                <select
                  id="activityTypeId"
                  value={form.activityTypeId}
                  onChange={(event) =>
                    updateField("activityTypeId", event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">No activity type selected</option>
                  {activeActivityTypes.map((activityType) => (
                    <option key={activityType.id} value={activityType.id}>
                      {activityType.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select the activity category assigned to this examination.
                </p>
              </div>

              <div>
                <label
                  htmlFor="reportMode"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Result Reporting
                </label>
                <select
                  id="reportMode"
                  value={form.reportMode}
                  onChange={(event) =>
                    updateField("reportMode", event.target.value as ReportMode)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="AUTOMATIC">
                    Automatic — include score in assessment results
                  </option>
                  <option value="MANUAL">
                    Manual — keep score separate
                  </option>
                  <option value="EXCLUDED">
                    Excluded — do not include in report calculations
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="durationMinutes"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Examination Duration (minutes)
                </label>
                <input
                  id="durationMinutes"
                  type="number"
                  min="1"
                  max="600"
                  required
                  value={form.durationMinutes}
                  onChange={(event) =>
                    updateField("durationMinutes", event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="maxAttempts"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Maximum Attempts
                </label>
                <input
                  id="maxAttempts"
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={form.maxAttempts}
                  onChange={(event) =>
                    updateField("maxAttempts", event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="opensAt"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Opens At
                </label>
                <input
                  id="opensAt"
                  type="datetime-local"
                  value={form.opensAt}
                  onChange={(event) =>
                    updateField("opensAt", event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave blank to allow access as soon as the exam is published.
                </p>
              </div>

              <div>
                <label
                  htmlFor="closesAt"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Closes At
                </label>
                <input
                  id="closesAt"
                  type="datetime-local"
                  value={form.closesAt}
                  onChange={(event) =>
                    updateField("closesAt", event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave blank if there is no scheduled closing time.
                </p>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Examination Behaviour
              </h4>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-lg border p-3">
                  <input
                    type="checkbox"
                    checked={form.shuffleQuestions}
                    onChange={(event) =>
                      updateField("shuffleQuestions", event.target.checked)
                    }
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-800">
                      Shuffle Questions
                    </span>
                    <span className="text-xs text-gray-500">
                      Present questions in a different order to each student.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-lg border p-3">
                  <input
                    type="checkbox"
                    checked={form.shuffleOptions}
                    onChange={(event) =>
                      updateField("shuffleOptions", event.target.checked)
                    }
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-800">
                      Shuffle Answer Options
                    </span>
                    <span className="text-xs text-gray-500">
                      Randomize the order of answer options.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-lg border p-3 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.allowBackNavigation}
                    onChange={(event) =>
                      updateField("allowBackNavigation", event.target.checked)
                    }
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-800">
                      Allow Back Navigation
                    </span>
                    <span className="text-xs text-gray-500">
                      Allow students to return to previous questions during the
                      examination.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label
                htmlFor="instructions"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Student Instructions
              </label>
              <textarea
                id="instructions"
                rows={4}
                maxLength={5000}
                value={form.instructions}
                onChange={(event) =>
                  updateField("instructions", event.target.value)
                }
                placeholder="Enter instructions students should read before starting the examination..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional instructions displayed to students before they begin.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <p className="text-xs text-gray-500">
                {settingsConfigured
                  ? "Changes are saved to the existing CBT configuration."
                  : "Save these settings before adding and publishing questions."}
              </p>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : settingsConfigured
                    ? "Update CBT Settings"
                    : "Save CBT Settings"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

