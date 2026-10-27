"use client";

import { useState } from "react";

type TeachingOption = {
  classId: number;
  subjectId: number;
  className: string;
  subjectName: string;
};

type AssignmentItem = {
  id: number;
  classId: number;
  subjectId: number;
  title: string;
  instructions: string;
  dueDate: string | null;
  maxScore: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string | null;
};

type Props = {
  teachingOptions: TeachingOption[];
  initialAssignments: AssignmentItem[];
};

type AssignmentForm = {
  title: string;
  instructions: string;
  maxScore: string;
  dueDate: string;
};

function formatDate(value: string | null) {
  if (!value) return "No deadline";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}

function getAssignmentForm(assignment: AssignmentItem): AssignmentForm {
  return {
    title: assignment.title,
    instructions: assignment.instructions,
    maxScore: String(assignment.maxScore),
    dueDate: toDateTimeLocal(assignment.dueDate),
  };
}

export default function TeacherAssignmentsClient({
  teachingOptions,
  initialAssignments,
}: Props) {
  const [assignments, setAssignments] = useState(initialAssignments);

  const [selectedPair, setSelectedPair] = useState(
    teachingOptions[0]
      ? `${teachingOptions[0].classId}:${teachingOptions[0].subjectId}`
      : "",
  );

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [maxScore, setMaxScore] = useState("10");
  const [dueDate, setDueDate] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<AssignmentForm>({
    title: "",
    instructions: "",
    maxScore: "10",
    dueDate: "",
  });

  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submitAssignment(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedPair) {
      setError("You do not have an assigned class and subject available.");
      return;
    }

    const [classId, subjectId] = selectedPair.split(":").map(Number);
    const score = Number(maxScore);

    if (!title.trim() || !instructions.trim()) {
      setError("Enter an assignment title and instructions.");
      return;
    }

    if (!Number.isFinite(score) || score <= 0) {
      setError("Maximum marks must be greater than zero.");
      return;
    }

    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;

    const isPublished = submitter?.value === "publish";

    let formattedDueDate: string | null = null;

    if (dueDate) {
      const parsedDate = new Date(dueDate);

      if (Number.isNaN(parsedDate.getTime())) {
        setError("Enter a valid deadline.");
        return;
      }

      formattedDueDate = parsedDate.toISOString();
    }

    setSaving(true);

    try {
      const response = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          subjectId,
          title: title.trim(),
          instructions: instructions.trim(),
          maxScore: score,
          dueDate: formattedDueDate,
          isPublished,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to create assignment.");
      }

      setAssignments((current) => [
        result.assignment as AssignmentItem,
        ...current,
      ]);

      setTitle("");
      setInstructions("");
      setMaxScore("10");
      setDueDate("");
      setSuccess(result.message || "Assignment created successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred.",
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(assignment: AssignmentItem) {
    setEditingId(assignment.id);
    setEditForm(getAssignmentForm(assignment));
    setError("");
    setSuccess("");
  }

  function cancelEditing() {
    setEditingId(null);
    setError("");
    setEditForm({
      title: "",
      instructions: "",
      maxScore: "10",
      dueDate: "",
    });
  }

  async function saveAssignmentChanges(
    event: React.FormEvent<HTMLFormElement>,
    assignment: AssignmentItem,
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const score = Number(editForm.maxScore);

    if (!editForm.title.trim() || !editForm.instructions.trim()) {
      setError("Enter an assignment title and instructions.");
      return;
    }

    if (!Number.isFinite(score) || score <= 0) {
      setError("Maximum marks must be greater than zero.");
      return;
    }

    let formattedDueDate: string | null = null;

    if (editForm.dueDate) {
      const parsedDate = new Date(editForm.dueDate);

      if (Number.isNaN(parsedDate.getTime())) {
        setError("Enter a valid deadline.");
        return;
      }

      formattedDueDate = parsedDate.toISOString();
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/teacher/assignments/${assignment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editForm.title.trim(),
            instructions: editForm.instructions.trim(),
            maxScore: score,
            dueDate: formattedDueDate,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to update assignment.");
      }

      const updatedAssignment = result.assignment as
        | AssignmentItem
        | undefined;

      if (!updatedAssignment) {
        throw new Error(
          "The server did not return the updated assignment. Refresh the page to verify the changes.",
        );
      }

      setAssignments((current) =>
        current.map((item) =>
          item.id === assignment.id ? updatedAssignment : item,
        ),
      );

      setEditingId(null);
      setSuccess("Assignment updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function publishDraft(assignment: AssignmentItem) {
    setError("");
    setSuccess("");
    setPublishingId(assignment.id);

    try {
      const response = await fetch(
        `/api/teacher/assignments/${assignment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublished: true }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to publish assignment.");
      }

      const updatedAssignment = result.assignment as
        | AssignmentItem
        | undefined;

      if (!updatedAssignment) {
        throw new Error(
          "The server did not return the published assignment. Refresh the page to verify its status.",
        );
      }

      setAssignments((current) =>
        current.map((item) =>
          item.id === assignment.id ? updatedAssignment : item,
        ),
      );

      setSuccess(`"${assignment.title}" has been published.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred.",
      );
    } finally {
      setPublishingId(null);
    }
  }

  const publishedCount = assignments.filter(
    (item) => item.isPublished,
  ).length;

  const draftCount = assignments.length - publishedCount;

  return (
    <main className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-blue-600">
          Teaching &amp; Learning
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          My Assignments
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Create homework for your assigned classes, set deadlines, and publish
          instructions for students.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total assignments" value={assignments.length} />
        <SummaryCard label="Published" value={publishedCount} />
        <SummaryCard label="Drafts" value={draftCount} />
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          {success}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Create an assignment
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Only classes and subjects assigned to your teacher profile are
            available.
          </p>
        </div>

        {teachingOptions.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            No class-subject assignments are available. Please ask your school
            administrator to assign your teaching classes and subjects.
          </div>
        ) : (
          <form onSubmit={submitAssignment} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Class and subject
                </span>

                <select
                  value={selectedPair}
                  onChange={(event) => setSelectedPair(event.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {teachingOptions.map((option) => (
                    <option
                      key={`${option.classId}:${option.subjectId}`}
                      value={`${option.classId}:${option.subjectId}`}
                    >
                      {option.className} — {option.subjectName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Maximum marks
                </span>

                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={maxScore}
                  onChange={(event) => setMaxScore(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Assignment title
              </span>

              <input
                type="text"
                required
                maxLength={200}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Exercise on fractions"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Instructions
              </span>

              <textarea
                required
                rows={6}
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="Explain the task, questions, and submission requirements..."
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block max-w-md">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Deadline (optional)
              </span>

              <input
                type="datetime-local"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              <button
                type="submit"
                value="draft"
                disabled={saving}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save as draft"}
              </button>

              <button
                type="submit"
                value="publish"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Publish assignment"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Assignment history
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            View, edit, and publish assignments you have created for your
            classes.
          </p>
        </div>

        {assignments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-blue-700">
              A
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No assignments yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Your assignments will appear here after you save or publish your
              first one.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assignments.map((assignment) => {
              const option = teachingOptions.find(
                (item) =>
                  item.classId === assignment.classId &&
                  item.subjectId === assignment.subjectId,
              );

              const isEditing = editingId === assignment.id;
              const isPublishing = publishingId === assignment.id;

              return (
                <article key={assignment.id} className="p-5 sm:px-6">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900">
                        {assignment.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        {option
                          ? `${option.className} · ${option.subjectName}`
                          : "Assigned class and subject"}
                      </p>
                    </div>

                    <span
                      className={
                        assignment.isPublished
                          ? "inline-flex w-fit shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
                          : "inline-flex w-fit shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                      }
                    >
                      {assignment.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {assignment.instructions}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span>Maximum marks: {assignment.maxScore}</span>
                    <span>Deadline: {formatDate(assignment.dueDate)}</span>
                    <span>Created: {formatDate(assignment.createdAt)}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditing) {
                          cancelEditing();
                        } else {
                          startEditing(assignment);
                        }
                      }}
                      disabled={saving || publishingId !== null}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      {isEditing ? "Cancel editing" : "Edit assignment"}
                    </button>

                    {!assignment.isPublished && (
                      <button
                        type="button"
                        onClick={() => publishDraft(assignment)}
                        disabled={saving || publishingId !== null}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isPublishing ? "Publishing..." : "Publish draft"}
                      </button>
                    )}
                  </div>

                  {isEditing && (
                    <form
                      onSubmit={(event) =>
                        saveAssignmentChanges(event, assignment)
                      }
                      className="mt-5 space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4"
                    >
                      <h4 className="font-semibold text-slate-900">
                        Edit assignment
                      </h4>

                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-slate-700">
                          Assignment title
                        </span>

                        <input
                          type="text"
                          required
                          maxLength={200}
                          value={editForm.title}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-slate-700">
                          Instructions
                        </span>

                        <textarea
                          required
                          rows={5}
                          value={editForm.instructions}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              instructions: event.target.value,
                            }))
                          }
                          className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-slate-700">
                            Maximum marks
                          </span>

                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            required
                            value={editForm.maxScore}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                maxScore: event.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-slate-700">
                            Deadline (optional)
                          </span>

                          <input
                            type="datetime-local"
                            value={editForm.dueDate}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                dueDate: event.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={saving || publishingId !== null}
                          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saving ? "Saving changes..." : "Save changes"}
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={saving}
                          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

