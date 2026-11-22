"use client";

import { useCallback, useEffect, useState } from "react";

type CBTAttempt = {
  id: number;
  attemptNumber: number;
  status: string;
  startedAt?: string | null;
  deadlineAt?: string | null;
  submittedAt?: string | null;
  score?: number | null;
  maxScore?: number | null;
};

type CBTAssessment = {
  assessmentId: number;
  title: string;
  subjectId: number;
  assessmentType: string;
  maxScore: number;
  description?: string | null;
  durationMinutes: number;
  opensAt?: string | null;
  closesAt?: string | null;
  maxAttempts: number;
  attemptsUsed: number;
  remainingAttempts: number;
  questionCount: number;
  status: string;
  canStart: boolean;
  hasUnfinishedAttempt: boolean;
  attemptExpired: boolean;
  currentAttempt: CBTAttempt | null;
  latestAttempt: CBTAttempt | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not specified";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getErrorMessage(data: unknown, fallback: string) {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return fallback;
}

export default function StudentCBTClient() {
  const [assessments, setAssessments] = useState<CBTAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const loadAssessments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/student/cbt/assessments", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to load your available exams."),
        );
      }

      setAssessments(
        Array.isArray(data.assessments) ? data.assessments : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your available exams.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssessments();
  }, [loadAssessments]);

  async function startOrResumeAttempt(assessmentId: number) {
    const actionKey = `start-${assessmentId}`;
    setActiveAction(actionKey);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/student/cbt/attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assessmentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to start this exam."),
        );
      }

      const attemptId = Number(data.attempt?.id);

      if (!Number.isSafeInteger(attemptId) || attemptId <= 0) {
        throw new Error("The server did not return a valid exam attempt.");
      }

      window.location.assign(`/student/cbt/attempts/${attemptId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start this exam.",
      );
      setActiveAction(null);
    }
  }

  async function submitExpiredAttempt(attemptId: number) {
    const actionKey = `submit-${attemptId}`;
    setActiveAction(actionKey);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/student/cbt/attempts/${attemptId}/submit`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to submit this expired attempt."),
        );
      }

      setNotice(
        typeof data.message === "string"
          ? data.message
          : "Your exam attempt has been submitted.",
      );

      await loadAssessments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit this expired attempt.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        Loading your available exams...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Available examinations
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select an examination to begin or continue.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNotice("");
            void loadAssessments();
          }}
          disabled={!!activeAction}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          {notice}
        </div>
      )}

      {assessments.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            No examinations available
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Published examinations for your class will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {assessments.map((assessment) => {
            const currentAttempt = assessment.currentAttempt;
            const actionKey = currentAttempt
              ? `submit-${currentAttempt.id}`
              : `start-${assessment.assessmentId}`;

            const isBusy = activeAction === actionKey;

            return (
              <article
                key={assessment.assessmentId}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {assessment.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Subject ID: {assessment.subjectId}
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {assessment.status}
                  </span>
                </div>

                {assessment.description && (
                  <p className="mt-3 text-sm text-slate-600">
                    {assessment.description}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Duration</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {assessment.durationMinutes} minutes
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Maximum marks</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {assessment.maxScore}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Questions</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {assessment.questionCount}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Attempts used</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {assessment.attemptsUsed} / {assessment.maxAttempts}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-500">
                  <p>
                    Opens: {formatDate(assessment.opensAt)}
                  </p>
                  <p>
                    Closes: {formatDate(assessment.closesAt)}
                  </p>
                  <p>
                    Attempts remaining: {assessment.remainingAttempts}
                  </p>
                </div>

                {currentAttempt && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-semibold text-amber-900">
                      Unfinished attempt #{currentAttempt.attemptNumber}
                    </p>
                    <p className="mt-1 text-xs text-amber-800">
                      Deadline: {formatDate(currentAttempt.deadlineAt)}
                    </p>
                    <p className="mt-1 text-xs text-amber-800">
                      {assessment.attemptExpired
                        ? "The deadline has passed. Submit your attempt."
                        : "You can continue where you stopped."}
                    </p>
                  </div>
                )}

                {assessment.latestAttempt && !currentAttempt && (
                  <div className="mt-4 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-600">
                      Latest attempt: #{assessment.latestAttempt.attemptNumber}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Status: {assessment.latestAttempt.status}
                    </p>
                  </div>
                )}

                <div className="mt-auto pt-5">
                  {currentAttempt ? (
                    assessment.attemptExpired ? (
                      <button
                        type="button"
                        onClick={() =>
                          void submitExpiredAttempt(currentAttempt.id)
                        }
                        disabled={!!activeAction}
                        className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isBusy ? "Submitting..." : "Submit expired attempt"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          window.location.assign(
                            `/student/cbt/attempts/${currentAttempt.id}`,
                          )
                        }
                        disabled={!!activeAction}
                        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Resume examination
                      </button>
                    )
                  ) : assessment.canStart ? (
                    <button
                      type="button"
                      onClick={() =>
                        void startOrResumeAttempt(assessment.assessmentId)
                      }
                      disabled={!!activeAction}
                      className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isBusy ? "Starting..." : "Start examination"}
                    </button>
                  ) : (
                    <div className="rounded-lg bg-slate-100 px-4 py-3 text-center text-sm font-medium text-slate-500">
                      {assessment.remainingAttempts <= 0
                        ? "No attempts remaining"
                        : "Examination is not currently available"}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
