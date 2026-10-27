"use client";

import { useCallback, useEffect, useState } from "react";

type Assignment = {
  id: number;
  title: string;
  instructions: string;
  maxScore: number;
  dueDate: string | null;
  isPublished: boolean;
};

type SubmissionStatus = "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";

type StudentSubmission = {
  studentId: number;
  firstName: string;
  lastName: string;
  admissionNumber: string | null;
  status: SubmissionStatus;
  submission: {
    id: number;
    answer: string | null;
    submittedAt: string | null;
    marks: number | null;
    feedback: string | null;
    gradedAt: string | null;
    gradedByUserId: number | null;
  } | null;
};

type ApiResponse = {
  assignment?: Assignment;
  submissions?: StudentSubmission[];
  summary?: {
    totalStudents: number;
    submitted: number;
    graded: number;
    notSubmitted: number;
  };
  message?: string;
  error?: string;
};

type Props = {
  assignment: Assignment;
};

export function AssignmentGradingClient({ assignment }: Props) {
  const [students, setStudents] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [marks, setMarks] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/teacher/assignments/${assignment.id}/submissions`,
        { cache: "no-store" },
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(result.error || "Unable to load submissions.");
      }

      const records = result.submissions ?? [];
      setStudents(records);

      setMarks((current) => {
        const next = { ...current };

        for (const student of records) {
          if (
            student.submission &&
            next[student.studentId] === undefined
          ) {
            next[student.studentId] =
              student.submission.marks === null
                ? ""
                : String(student.submission.marks);
          }
        }

        return next;
      });

      setFeedback((current) => {
        const next = { ...current };

        for (const student of records) {
          if (
            student.submission &&
            next[student.studentId] === undefined
          ) {
            next[student.studentId] =
              student.submission.feedback ?? "";
          }
        }

        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load submissions.",
      );
    } finally {
      setLoading(false);
    }
  }, [assignment.id]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  async function saveGrade(student: StudentSubmission) {
    const submission = student.submission;

    if (!submission || student.status === "NOT_SUBMITTED") {
      return;
    }

    const rawMarks = marks[student.studentId] ?? "";
    const numericMarks = Number(rawMarks);

    if (
      rawMarks.trim() === "" ||
      !Number.isFinite(numericMarks) ||
      numericMarks < 0 ||
      numericMarks > assignment.maxScore
    ) {
      setError(
        `Enter a valid mark between 0 and ${assignment.maxScore}.`,
      );
      return;
    }

    const studentId = student.studentId;
    setSavingId(studentId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/teacher/assignments/${assignment.id}/submissions/${submission.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            marks: numericMarks,
            feedback: feedback[studentId] ?? "",
          }),
        },
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(result.error || "Unable to save grade.");
      }

      setNotice(
        `Grade saved for ${student.firstName} ${student.lastName}.`,
      );

      await loadSubmissions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save grade.",
      );
    } finally {
      setSavingId(null);
    }
  }

  const submittedCount = students.filter(
    (student) =>
      student.status === "SUBMITTED" || student.status === "GRADED",
  ).length;

  const gradedCount = students.filter(
    (student) => student.status === "GRADED",
  ).length;

  const pendingCount = students.filter(
    (student) => student.status === "NOT_SUBMITTED",
  ).length;

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {assignment.title}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Maximum score: {assignment.maxScore} marks
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Deadline:{" "}
              {assignment.dueDate
                ? new Date(assignment.dueDate).toLocaleString()
                : "No deadline"}
            </p>
          </div>

          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            Published
          </span>
        </div>

        <div className="mt-4 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          {assignment.instructions}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Submitted" value={submittedCount} />
        <StatCard label="Graded" value={gradedCount} />
        <StatCard label="Not Submitted" value={pendingCount} />
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          {notice}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          Loading student submissions...
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          No active students were found in this class.
        </div>
      ) : (
        <section className="space-y-4">
          {students.map((student) => {
            const submission = student.submission;
            const isSubmitted = submission?.submittedAt != null;

            return (
              <article
                key={student.studentId}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {student.firstName} {student.lastName}
                    </h2>
                    {student.admissionNumber && (
                      <p className="mt-1 text-sm text-gray-500">
                        Admission No: {student.admissionNumber}
                      </p>
                    )}
                    <p className="mt-2 text-sm">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          student.status === "GRADED"
                            ? "bg-blue-100 text-blue-800"
                            : student.status === "SUBMITTED"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {student.status.replaceAll("_", " ")}
                      </span>
                    </p>
                  </div>

                  {submission?.submittedAt && (
                    <p className="text-sm text-gray-500">
                      Submitted:{" "}
                      {new Date(submission.submittedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {!isSubmitted ? (
                  <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                    This student has not submitted an answer yet.
                  </p>
                ) : (
                  <>
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Student Answer
                      </h3>
                      <div className="mt-2 min-h-20 whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
                        {submission?.answer || "No answer provided."}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`marks-${student.studentId}`}
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Marks (out of {assignment.maxScore})
                        </label>
                        <input
                          id={`marks-${student.studentId}`}
                          type="number"
                          min="0"
                          max={assignment.maxScore}
                          step="any"
                          value={marks[student.studentId] ?? ""}
                          onChange={(event) =>
                            setMarks((current) => ({
                              ...current,
                              [student.studentId]: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`feedback-${student.studentId}`}
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Feedback
                        </label>
                        <textarea
                          id={`feedback-${student.studentId}`}
                          rows={3}
                          maxLength={5000}
                          value={feedback[student.studentId] ?? ""}
                          onChange={(event) =>
                            setFeedback((current) => ({
                              ...current,
                              [student.studentId]: event.target.value,
                            }))
                          }
                          placeholder="Provide feedback to the student..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    {submission?.gradedAt && (
                      <p className="mt-3 text-xs text-gray-500">
                        Last graded:{" "}
                        {new Date(submission.gradedAt).toLocaleString()}
                      </p>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void saveGrade(student)}
                        disabled={savingId !== null}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === student.studentId
                          ? "Saving..."
                          : student.status === "GRADED"
                            ? "Update Grade"
                            : "Save Grade"}
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
