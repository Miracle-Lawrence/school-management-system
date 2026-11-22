"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CBTImage = {
  id: number;
  altText?: string | null;
  caption?: string | null;
  url: string;
};

type CBTOption = {
  id: number;
  text: string;
  images: CBTImage[];
};

type CBTQuestion = {
  id: number;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "THEORY";
  prompt: string;
  marks: number;
  allowMultipleAnswers: boolean;
  images: CBTImage[];
  options: CBTOption[];
  savedAnswer: {
    selectedOptionIds: number[];
    answerText: string | null;
  };
};

type CBTAttempt = {
  attemptId: number;
  attemptNumber: number;
  status: string;
  deadlineAt: string;
  expired: boolean;
  assessment: {
    id: number;
    title: string;
    description?: string | null;
    maxScore: number;
    durationMinutes: number;
    instructions?: string | null;
    allowBackNavigation: boolean;
  };
  questions: CBTQuestion[];
};

type Answer = {
  selectedOptionIds: number[];
  answerText: string;
};

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

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function ExamImages({ images }: { images: CBTImage[] }) {
  if (images.length === 0) return null;

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {images.map((image) => (
        <figure key={image.id} className="overflow-hidden rounded-lg border border-slate-200">
          <img
            src={image.url}
            alt={image.altText || "Examination image"}
            className="max-h-80 w-full object-contain"
          />
          {image.caption && (
            <figcaption className="bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {image.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

export default function StudentCBTExamClient({
  attemptId,
}: {
  attemptId: number;
}) {
  const [attempt, setAttempt] = useState<CBTAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savingQuestions, setSavingQuestions] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const saveQueues = useRef<Map<number, Promise<void>>>(new Map());
  const failedSaveIds = useRef<Set<number>>(new Set());
  const submittingRef = useRef(false);

  const loadAttempt = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/student/cbt/attempts/${attemptId}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to load this examination."),
        );
      }

      const loadedAttempt = data.attempt as CBTAttempt;

      if (
        !loadedAttempt ||
        !Array.isArray(loadedAttempt.questions) ||
        !loadedAttempt.deadlineAt
      ) {
        throw new Error("The examination data returned by the server is invalid.");
      }

      const initialAnswers: Record<number, Answer> = {};

      for (const question of loadedAttempt.questions) {
        initialAnswers[question.id] = {
          selectedOptionIds: question.savedAnswer.selectedOptionIds || [],
          answerText: question.savedAnswer.answerText || "",
        };
      }

      setAttempt(loadedAttempt);
      setAnswers(initialAnswers);

      const deadline = new Date(loadedAttempt.deadlineAt).getTime();
      setRemainingSeconds(
        Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load this examination.",
      );
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    void loadAttempt();
  }, [loadAttempt]);

  const saveAnswer = useCallback(
    (
      questionId: number,
      selectedOptionIds: number[],
      answerText: string,
    ) => {
      if (submittingRef.current) return;

      setSavingQuestions((previous) =>
        previous.includes(questionId)
          ? previous
          : [...previous, questionId],
      );

      const previousSave =
        saveQueues.current.get(questionId) || Promise.resolve();

      const nextSave = previousSave
        .catch(() => undefined)
        .then(async () => {
          const response = await fetch(
            `/api/student/cbt/attempts/${attemptId}/answers`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                questionId,
                selectedOptionIds,
                answerText,
              }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              getErrorMessage(data, "Unable to save your answer."),
            );
          }

          failedSaveIds.current.delete(questionId);
          if (failedSaveIds.current.size === 0) setSaveError("");
        });

      const handledSave = nextSave.catch((err: unknown) => {
        failedSaveIds.current.add(questionId);
        setSaveError(
          err instanceof Error
            ? err.message
            : "An answer could not be saved. Please try again.",
        );
      });

      saveQueues.current.set(questionId, handledSave);

      void handledSave.finally(() => {
        if (saveQueues.current.get(questionId) === handledSave) {
          setSavingQuestions((previous) =>
            previous.filter((id) => id !== questionId),
          );
        }
      });
    },
    [attemptId],
  );

  function updateAnswer(question: CBTQuestion, answer: Answer) {
    if (submittingRef.current) return;

    setAnswers((previous) => ({
      ...previous,
      [question.id]: answer,
    }));

    saveAnswer(
      question.id,
      answer.selectedOptionIds,
      answer.answerText,
    );
  }

  const submitAttempt = useCallback(
    async (automatic = false) => {
      if (submittingRef.current || submitted) return;

      if (
        !automatic &&
        !window.confirm(
          "Are you sure you want to submit your examination? You cannot change your answers after submission.",
        )
      ) {
        return;
      }

      submittingRef.current = true;
      setSubmitting(true);
      setError("");

      try {
        await Promise.all(Array.from(saveQueues.current.values()));

        if (!automatic && failedSaveIds.current.size > 0) {
          throw new Error(
            "Some answers could not be saved. Please check your connection and try again.",
          );
        }

        const response = await fetch(
          `/api/student/cbt/attempts/${attemptId}/submit`,
          {
            method: "POST",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            getErrorMessage(data, "Unable to submit your examination."),
          );
        }

        setSubmitted(true);
        setRemainingSeconds(0);
        setSaveError("");
        setError("");
      } catch (err) {
        submittingRef.current = false;
        setSubmitting(false);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to submit your examination.",
        );
      }
    },
    [attemptId, submitted],
  );

  useEffect(() => {
    if (!attempt || remainingSeconds === null || submitted) return;

    const timer = window.setInterval(() => {
      const deadline = new Date(attempt.deadlineAt).getTime();
      const nextRemaining = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000),
      );

      setRemainingSeconds(nextRemaining);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [attempt, remainingSeconds === null, submitted]);

  useEffect(() => {
    if (
      !loading &&
      attempt &&
      remainingSeconds === 0 &&
      !submitted &&
      !submittingRef.current
    ) {
      void submitAttempt(true);
    }
  }, [attempt, loading, remainingSeconds, submitted, submitAttempt]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        Loading examination...
      </div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">{error}</p>
        <a
          href="/student/cbt"
          className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Return to examinations
        </a>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
          ?
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Examination submitted
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Your answers have been submitted successfully.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Your result will be available when it is released by your school.
        </p>
        <a
          href="/student/cbt"
          className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Return to examinations
        </a>
      </div>
    );
  }

  if (!attempt || attempt.questions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-600">
          No examination questions were found.
        </p>
        <a
          href="/student/cbt"
          className="mt-4 inline-flex text-sm font-semibold text-blue-600"
        >
          Return to examinations
        </a>
      </div>
    );
  }

  const question = attempt.questions[currentIndex];
  const currentAnswer = answers[question.id] || {
    selectedOptionIds: [],
    answerText: "",
  };

  const answeredCount = attempt.questions.filter((item) => {
    const answer = answers[item.id];

    if (!answer) return false;

    return (
      answer.selectedOptionIds.length > 0 ||
      answer.answerText.trim().length > 0
    );
  }).length;

  const isSaving = savingQuestions.length > 0;
  const isLastQuestion = currentIndex === attempt.questions.length - 1;

  function toggleOption(optionId: number) {
    let selectedOptionIds: number[];

    if (question.allowMultipleAnswers) {
      selectedOptionIds = currentAnswer.selectedOptionIds.includes(optionId)
        ? currentAnswer.selectedOptionIds.filter((id) => id !== optionId)
        : [...currentAnswer.selectedOptionIds, optionId];
    } else {
      selectedOptionIds = currentAnswer.selectedOptionIds.includes(optionId)
        ? []
        : [optionId];
    }

    updateAnswer(question, {
      selectedOptionIds,
      answerText: "",
    });
  }

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Computer-based examination
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              {attempt.assessment.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Attempt #{attempt.attemptNumber}
            </p>
          </div>

          <div
            className={`rounded-lg px-4 py-3 text-center ${
              remainingSeconds !== null && remainingSeconds <= 300
                ? "bg-red-50 text-red-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            <p className="text-xs font-medium">Time remaining</p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
              {remainingSeconds === null
                ? "--:--:--"
                : formatTime(remainingSeconds)}
            </p>
          </div>
        </div>

        {attempt.assessment.description && (
          <p className="mt-3 text-sm text-slate-600">
            {attempt.assessment.description}
          </p>
        )}

        {attempt.assessment.instructions && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              Examination instructions
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-amber-800">
              {attempt.assessment.instructions}
            </p>
          </div>
        )}
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {saveError && (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {saveError}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <main className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Question {currentIndex + 1} of {attempt.questions.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {question.type.replaceAll("_", " ")} ï¿½ {question.marks} marks
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {question.type === "THEORY"
                ? "Written response"
                : question.allowMultipleAnswers && question.type === "MULTIPLE_CHOICE"
                  ? "Select all correct answers"
                  : "Select one answer"}
            </span>
          </div>

          <div className="mt-6">
            <h2 className="whitespace-pre-wrap text-base font-semibold leading-7 text-slate-900">
              {question.prompt}
            </h2>

            <ExamImages images={question.images} />

            {question.type === "THEORY" ? (
              <div className="mt-6">
                <label
                  htmlFor={`answer-${question.id}`}
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Your answer
                </label>
                <textarea
                  id={`answer-${question.id}`}
                  value={currentAnswer.answerText}
                  disabled={submitting}
                  onChange={(event) =>
                    updateAnswer(question, {
                      selectedOptionIds: [],
                      answerText: event.target.value,
                    })
                  }
                  rows={9}
                  placeholder="Type your answer here..."
                  className="w-full rounded-lg border border-slate-300 p-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {question.options.map((option, index) => {
                  const selected =
                    currentAnswer.selectedOptionIds.includes(option.id);

                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition ${
                        selected
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      } ${submitting ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      <input
                        type={
                          question.allowMultipleAnswers ? "checkbox" : "radio"
                        }
                        name={`question-${question.id}`}
                        checked={selected}
                        disabled={submitting}
                        onChange={() => toggleOption(option.id)}
                        className="mt-1 h-4 w-4 accent-blue-600"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-wrap text-sm font-medium text-slate-800">
                          <span className="mr-2 text-slate-500">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          {option.text}
                        </p>
                        <ExamImages images={option.images} />
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              disabled={
                submitting ||
                currentIndex === 0 ||
                !attempt.assessment.allowBackNavigation
              }
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {!isLastQuestion ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  setCurrentIndex((index) =>
                    Math.min(attempt.questions.length - 1, index + 1),
                  )
                }
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Next question
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void submitAttempt(false)}
                disabled={submitting}
                className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit examination"}
              </button>
            )}
          </div>
        </main>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Question navigator
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {answeredCount} of {attempt.questions.length} answered
          </p>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {attempt.questions.map((item, index) => {
              const answer = answers[item.id];
              const isAnswered =
                !!answer &&
                (answer.selectedOptionIds.length > 0 ||
                  answer.answerText.trim().length > 0);

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={
                    submitting ||
                    (!attempt.assessment.allowBackNavigation &&
                      (index < currentIndex || index > currentIndex + 1))
                  }
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to question ${index + 1}`}
                  className={`flex h-10 items-center justify-center rounded-lg border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    index === currentIndex
                      ? "border-blue-600 bg-blue-600 text-white"
                      : isAnswered
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <p className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-blue-600" />
              Current question
            </p>
            <p className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-green-100 ring-1 ring-green-200" />
              Answered
            </p>
            <p className="flex items-center gap-2">
              <span className="h-3 w-3 rounded border border-slate-300 bg-white" />
              Not answered
            </p>
          </div>

          <div className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            {isSaving
              ? "Saving your answers..."
              : "Your answers are saved automatically."}
          </div>

          <button
            type="button"
            onClick={() => void submitAttempt(false)}
            disabled={submitting}
            className="mt-4 w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit examination"}
          </button>
        </aside>
      </div>
    </div>
  );
}

