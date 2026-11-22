"use client";

import { useCallback, useEffect, useState } from "react";

type CBTActivityType = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
};

export default function CBTActivityTypeManager() {
  const [activityTypes, setActivityTypes] = useState<CBTActivityType[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadActivityTypes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/school/cbt/activity-types?includeInactive=true",
        { cache: "no-store" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load activity types.");
      }

      setActivityTypes(data.activityTypes ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load activity types.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActivityTypes();
  }, [loadActivityTypes]);

  function resetForm() {
    setName("");
    setDescription("");
    setEditingId(null);
    setError("");
    setSuccess("");
  }

  function startEditing(activityType: CBTActivityType) {
    setEditingId(activityType.id);
    setName(activityType.name);
    setDescription(activityType.description ?? "");
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Enter an activity type name.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing = editingId !== null;
      const response = await fetch(
        isEditing
          ? `/api/school/cbt/activity-types/${editingId}`
          : "/api/school/cbt/activity-types",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save activity type.");
      }

      resetForm();
      setSuccess(
        isEditing
          ? "Activity type updated successfully."
          : "Activity type created successfully.",
      );

      await loadActivityTypes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save activity type.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(activityType: CBTActivityType) {
    const action = activityType.isActive ? "deactivate" : "reactivate";

    if (
      activityType.isActive &&
      !window.confirm(
        `Are you sure you want to deactivate "${activityType.name}"?`,
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/school/cbt/activity-types/${activityType.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !activityType.isActive }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Unable to ${action} activity type.`);
      }

      setSuccess(`Activity type ${action}d successfully.`);
      await loadActivityTypes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Unable to ${action} activity type.`,
      );
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId !== null ? "Edit Activity Type" : "Create Activity Type"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Activity types classify CBT assessments and help organize their
            reporting.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="activityTypeName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Activity Type Name
            </label>
            <input
              id="activityTypeName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              maxLength={100}
              placeholder="e.g. Class Test"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="activityTypeDescription"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Description <span className="font-normal text-slate-400">(Optional)</span>
            </label>
            <textarea
              id="activityTypeDescription"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Describe how this activity type will be used."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Save Changes"
                  : "Create Activity Type"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-900">
              Configured Activity Types
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage the activity types available when configuring CBT assessments.
            </p>
          </div>
          <span className="text-sm text-slate-500">
            {activityTypes.length} total
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading activity types...
          </div>
        ) : activityTypes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium text-slate-700">
              No activity types created yet.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Create your first activity type using the form above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activityTypes.map((activityType) => (
              <div
                key={activityType.id}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-slate-900">
                      {activityType.name}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        activityType.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {activityType.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {activityType.description || "No description provided."}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(activityType)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(activityType)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                      activityType.isActive
                        ? "border border-red-200 text-red-700 hover:bg-red-50"
                        : "border border-green-200 text-green-700 hover:bg-green-50"
                    }`}
                  >
                    {activityType.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
