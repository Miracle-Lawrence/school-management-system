"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CBTQuestionManager from "@/components/cbt-question-manager";

type Subject = {
  id: number;
  name: string;
};

type QuestionBank = {
  id: number;
  subjectId: number;
  title: string;
  description: string | null;
  isActive: boolean;
};

type Props = {
  subjects: Subject[];
};

export default function CBTQuestionBankManager({ subjects }: Props) {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [managingBank, setManagingBank] = useState<QuestionBank | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const subjectNames = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject.name])),
    [subjects],
  );

  const loadBanks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/school/cbt/question-banks?includeInactive=true",
        { cache: "no-store" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load question banks.");
      }

      setBanks(data.questionBanks ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load question banks.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBanks();
  }, [loadBanks]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedSubjectId("");
    setEditingBank(null);
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedSubjectId) {
      setError("Please select a subject.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/school/cbt/question-banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: Number(selectedSubjectId),
          title: title.trim(),
          description: description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create question bank.");
      }

      setMessage("Question bank created successfully.");
      resetForm();
      await loadBanks();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create question bank.",
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (bank: QuestionBank) => {
    setEditingBank(bank);
    setTitle(bank.title);
    setDescription(bank.description ?? "");
    setSelectedSubjectId(String(bank.subjectId));
    setError("");
    setMessage("");
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingBank) return;

    setError("");
    setMessage("");
    setSaving(true);

    try {
      const response = await fetch(
        `/api/school/cbt/question-banks/${editingBank.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || undefined,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update question bank.");
      }

      setMessage("Question bank updated successfully.");
      resetForm();
      await loadBanks();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update question bank.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleBankStatus = async (bank: QuestionBank) => {
    setError("");
    setMessage("");

    const action = bank.isActive ? "deactivate" : "reactivate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} "${bank.title}"?`,
      )
    ) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/school/cbt/question-banks/${bank.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !bank.isActive }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Unable to ${action} question bank.`);
      }

      setMessage(`Question bank ${action}d successfully.`);
      await loadBanks();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to ${action} question bank.`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {message}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingBank ? "Edit Question Bank" : "Create Question Bank"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {editingBank
              ? "Update the question bank details."
              : "Create a collection of questions for a particular subject."}
          </p>
        </div>

        {subjects.length === 0 ? (
          <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            No subjects are available to you. Please contact your school
            administrator if you believe this is incorrect.
          </p>
        ) : (
          <form
            onSubmit={editingBank ? handleUpdate : handleCreate}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <label
                htmlFor="question-bank-subject"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Subject
              </label>
              <select
                id="question-bank-subject"
                value={selectedSubjectId}
                onChange={(event) => setSelectedSubjectId(event.target.value)}
                disabled={saving || Boolean(editingBank)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {editingBank && (
                <p className="mt-1 text-xs text-slate-500">
                  A question bank cannot be moved to another subject.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="question-bank-title"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Question Bank Title
              </label>
              <input
                id="question-bank-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                minLength={2}
                maxLength={150}
                placeholder="e.g. First Term Mathematics"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="question-bank-description"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Description (Optional)
              </label>
              <textarea
                id="question-bank-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Describe the purpose or contents of this question bank."
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={saving || !title.trim() || !selectedSubjectId}
                className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingBank
                    ? "Save Changes"
                    : "Create Question Bank"}
              </button>

              {editingBank && (
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
        )}
      </section>

      {managingBank && (
        <CBTQuestionManager
          bankId={managingBank.id}
          bankTitle={managingBank.title}
          onClose={() => setManagingBank(null)}
        />
      )}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Question Banks
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {banks.length} question bank{banks.length === 1 ? "" : "s"} found
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadBanks()}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading question banks...
          </div>
        ) : banks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="font-semibold text-slate-800">
              No question banks yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Create your first question bank using the form above.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {banks.map((bank) => (
              <article
                key={bank.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-slate-900">
                      {bank.title}
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      {subjectNames.get(bank.subjectId) ?? "Unknown subject"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      bank.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {bank.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="mt-3 min-h-10 whitespace-pre-wrap text-sm text-slate-600">
                  {bank.description || "No description provided."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setManagingBank(bank)}
                    disabled={saving}
                    className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
                  >
                    Manage Questions
                  </button>

                  <button
                    type="button"
                    onClick={() => startEditing(bank)}
                    disabled={saving}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => void toggleBankStatus(bank)}
                    disabled={saving}
                    className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${
                      bank.isActive
                        ? "border border-red-200 text-red-700 hover:bg-red-50"
                        : "border border-green-200 text-green-700 hover:bg-green-50"
                    }`}
                  >
                    {bank.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

