"use client";

import { useCallback, useEffect, useState } from "react";

type SubmissionStatus = "PENDING" | "SUBMITTED" | "GRADED" | "OVERDUE";

type Assignment = {
  id: number;
  title: string;
  instructions: string;
  dueDate: string | null;
  maxScore: number;
  subjectName?: string;
  status: SubmissionStatus;
  submission: {
    id: number;
    answer: string | null;
    submittedAt: string | null;
    marks: number | null;
    feedback: string | null;
    gradedAt: string | null;
  } | null;
};

type ApiResponse = {
  assignments?: Assignment[];
  message?: string;
};

function formatDate(value: string | null) {
  if (!value) return "No deadline";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusStyle(status: SubmissionStatus) {
  switch (status) {
    case "GRADED":
      return "bg-emerald-100 text-emerald-800";
    case "SUBMITTED":
      return "bg-blue-100 text-blue-800";
    case "OVERDUE":
      return "bg-red-100 text-red-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

export default function StudentAssignmentsClient() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/student/assignments", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(result.message || "Unable to load assignments.");
      }

      const items = result.assignments ?? [];
      setAssignments(items);

      setAnswers((previous) => {
        const next = { ...previous };

        for (const assignment of items) {
          if (!(assignment.id in next)) {
            next[assignment.id] = assignment.submission?.answer ?? "";
          }
        }

        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load assignments.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  async function submitAnswer(assignment: Assignment) {
    const answer = (answers[assignment.id] ?? "").trim();

    if (!answer) {
      setError("Please enter your answer before submitting.");
      setNotice("");
      return;
    }

    if (answer.length > 20000) {
      setError("Your answer cannot exceed 20,000 characters.");
      setNotice("");
      return;
    }

    setSubmittingId(assignment.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/student/assignments/${assignment.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer }),
        },
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(result.message || "Unable to submit your answer.");
      }

      setNotice(`Your answer for "${assignment.title}" was submitted.`);
      await loadAssignments();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to submit your answer.",
      );
    } finally {
      setSubmittingId(null);
    }
  }

  const pendingCount = assignments.filter(
    (assignment) =>
      assignment.status === "PENDING" || assignment.status === "OVERDUE",
  ).length;

  const submittedCount = assignments.filter(
    (assignment) => assignment.status === "SUBMITTED",
  ).length;

  const gradedCount = assignments.filter(
    (assignment) => assignment.status === "GRADED",
  ).length;

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        Loading your assignments...
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">To do / overdue</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Submitted</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">
            {submittedCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Graded</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {gradedCount}
          </p>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
        </div>
      )}

      {assignments.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-700">
            ?
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No assignments available
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Published assignments for your class will appear here.
          </p>
          <button
            type="button"
            onClick={() => void loadAssignments()}
            className="mt-5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Refresh
          </button>
        </section>
      ) : (
        <section className="space-y-5">
          {assignments.map((assignment) => {
            const canSubmit =
              assignment.status !== "GRADED" &&
              assignment.status !== "OVERDUE";

            return (
              <article
                key={assignment.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                        {assignment.title}
                      </h2>

                      {assignment.subjectName && (
                        <p className="mt-1 text-sm font-medium text-blue-700">
                          {assignment.subjectName}
                        </p>
                      )}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(assignment.status)}`}
                    >
                      {assignment.status === "PENDING"
                        ? "Pending"
                        : assignment.status === "SUBMITTED"
                          ? "Submitted"
                          : assignment.status === "GRADED"
                            ? "Graded"
                            : "Overdue"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-slate-500">Deadline</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {formatDate(assignment.dueDate)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-slate-500">Maximum marks</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {assignment.maxScore}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Instructions
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {assignment.instructions}
                    </p>
                  </div>

                  {assignment.submission?.submittedAt && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                        Last submitted
                      </p>
                      <p className="mt-1 text-sm text-blue-900">
                        {formatDate(assignment.submission.submittedAt)}
                      </p>
                    </div>
                  )}

                  {assignment.status === "GRADED" && assignment.submission && (
                    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">
                          Your marks
                        </p>
                        <p className="mt-1 text-2xl font-bold text-emerald-800">
                          {assignment.submission.marks ?? 0} / {assignment.maxScore}
                        </p>
                      </div>

                      {assignment.submission.feedback && (
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">
                            Teacher feedback
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-emerald-800">
                            {assignment.submission.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {canSubmit ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void submitAnswer(assignment);
                      }}
                      className="space-y-3"
                    >
                      <label
                        htmlFor={`answer-${assignment.id}`}
                        className="block text-sm font-semibold text-slate-800"
                      >
                        {assignment.submission?.submittedAt
                          ? "Update your answer"
                          : "Your answer"}
                      </label>

                      <textarea
                        id={`answer-${assignment.id}`}
                        value={answers[assignment.id] ?? ""}
                        onChange={(event) =>
                          setAnswers((previous) => ({
                            ...previous,
                            [assignment.id]: event.target.value,
                          }))
                        }
                        rows={6}
                        maxLength={20000}
                        placeholder="Type your answer here..."
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-slate-500">
                          {(answers[assignment.id] ?? "").length}/20,000 characters
                        </p>

                        <button
                          type="submit"
                          disabled={submittingId === assignment.id}
                          className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submittingId === assignment.id
                            ? "Submitting..."
                            : assignment.submission?.submittedAt
                              ? "Update submission"
                              : "Submit answer"}
                        </button>
                      </div>
                    </form>
                  ) : assignment.status === "OVERDUE" ? (
                    <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                      The deadline has passed. This assignment can no longer
                      be submitted through the portal.
                    </p>
                  ) : (
                    <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                      This assignment has been graded. Your answer can no longer
                      be changed.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
