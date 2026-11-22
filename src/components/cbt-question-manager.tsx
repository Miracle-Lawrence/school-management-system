"use client";

import { useCallback, useEffect, useState } from "react";

type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "THEORY";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

type QuestionOption = {
  id: number;
  text: string;
  isCorrect: boolean;
  displayOrder: number;
  images?: unknown[];
};

type Question = {
  id: number;
  type: QuestionType;
  prompt: string;
  marks: number;
  difficulty: Difficulty;
  explanation: string | null;
  allowMultipleAnswers: boolean;
  isActive: boolean;
  options: QuestionOption[];
};

type Props = {
  bankId: number;
  bankTitle: string;
  onClose: () => void;
};

type OptionInput = {
  text: string;
  isCorrect: boolean;
};

const emptyOptions = (): OptionInput[] => [
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
];

export default function CBTQuestionManager({
  bankId,
  bankTitle,
  onClose,
}: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [type, setType] = useState<QuestionType>("MULTIPLE_CHOICE");
  const [prompt, setPrompt] = useState("");
  const [marks, setMarks] = useState("1");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [explanation, setExplanation] = useState("");
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);
  const [options, setOptions] = useState<OptionInput[]>(emptyOptions);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/school/cbt/question-banks/${bankId}/questions?includeInactive=${includeInactive}`,
        { cache: "no-store" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load questions.");
      }

      setQuestions(data.questions ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load questions.",
      );
    } finally {
      setLoading(false);
    }
  }, [bankId, includeInactive]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const resetForm = () => {
    setType("MULTIPLE_CHOICE");
    setPrompt("");
    setMarks("1");
    setDifficulty("MEDIUM");
    setExplanation("");
    setAllowMultipleAnswers(false);
    setOptions(emptyOptions());
  };

  const changeType = (nextType: QuestionType) => {
    setType(nextType);
    setAllowMultipleAnswers(false);

    if (nextType === "MULTIPLE_CHOICE") {
      setOptions(emptyOptions());
    } else if (nextType === "TRUE_FALSE") {
      setOptions([
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false },
      ]);
    } else {
      setOptions([]);
    }
  };

  const updateOption = (
    index: number,
    field: "text" | "isCorrect",
    value: string | boolean,
  ) => {
    setOptions((current) =>
      current.map((option, optionIndex) => {
        if (optionIndex !== index) {
          if (
            field === "isCorrect" &&
            value === true &&
            !allowMultipleAnswers
          ) {
            return { ...option, isCorrect: false };
          }

          return option;
        }

        return { ...option, [field]: value };
      }),
    );
  };

  const addOption = () => {
    setOptions((current) => [
      ...current,
      { text: "", isCorrect: false },
    ]);
  };

  const removeOption = (index: number) => {
    setOptions((current) =>
      current.filter((_, optionIndex) => optionIndex !== index),
    );
  };

  const editingHasOptionImages = Boolean(
    editingQuestion?.options.some((option) => (option.images?.length ?? 0) > 0),
  );

  const startEditing = (question: Question) => {
    setEditingQuestion(question);
    setType(question.type);
    setPrompt(question.prompt);
    setMarks(String(question.marks));
    setDifficulty(question.difficulty);
    setExplanation(question.explanation ?? "");
    setAllowMultipleAnswers(question.allowMultipleAnswers);
    setOptions(
      question.options.map((option) => ({
        text: option.text,
        isCorrect: option.isCorrect,
      })),
    );
    setError("");
    setMessage("");
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!prompt.trim()) {
      setError("Enter the question prompt.");
      return;
    }

    const questionMarks = Number(marks);

    if (!Number.isFinite(questionMarks) || questionMarks <= 0) {
      setError("Marks must be a number greater than zero.");
      return;
    }

    if (type !== "THEORY" && !editingHasOptionImages) {
      if (options.some((option) => !option.text.trim())) {
        setError("Enter text for every answer option.");
        return;
      }

      if (!options.some((option) => option.isCorrect)) {
        setError("Select at least one correct answer.");
        return;
      }

      if (type === "MULTIPLE_CHOICE" && options.length < 2) {
        setError("Multiple-choice questions need at least two options.");
        return;
      }
    }

    setSaving(true);

    try {
      const body = {
        ...(editingQuestion ? {} : { type }),
        prompt: prompt.trim(),
        marks: questionMarks,
        difficulty,
        explanation: explanation.trim() || undefined,
        allowMultipleAnswers:
          editingHasOptionImages && editingQuestion
            ? editingQuestion.allowMultipleAnswers
            : type === "MULTIPLE_CHOICE"
              ? allowMultipleAnswers
              : false,
        ...(type !== "THEORY" && !editingHasOptionImages
          ? {
              options: options.map((option, index) => ({
                text: option.text.trim(),
                isCorrect: option.isCorrect,
                displayOrder: index + 1,
              })),
            }
          : {}),
      };

      const url = editingQuestion
        ? `/api/school/cbt/questions/${editingQuestion.id}`
        : `/api/school/cbt/question-banks/${bankId}/questions`;

      const response = await fetch(url, {
        method: editingQuestion ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (editingQuestion
              ? "Unable to update question."
              : "Unable to create question."),
        );
      }

      setMessage(
        editingQuestion
          ? "Question updated successfully."
          : "Question created successfully.",
      );
      setEditingQuestion(null);
      resetForm();
      await loadQuestions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save question.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (question: Question) => {
    const confirmed = window.confirm(
      "Deactivate this question? It will no longer be available for new CBT activities.",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");
    setSaving(true);

    try {
      const response = await fetch(
        `/api/school/cbt/questions/${question.id}`,
        { method: "DELETE" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to deactivate question.");
      }

      if (editingQuestion?.id === question.id) {
        setEditingQuestion(null);
        resetForm();
      }

      setMessage("Question deactivated successfully.");
      await loadQuestions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to deactivate question.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="space-y-6 rounded-xl border border-blue-200 bg-blue-50/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Question Bank
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            {bankTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Add and review questions in this bank.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Close
        </button>
      </div>

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

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">
          {editingQuestion ? "Edit Question" : "Add a Question"}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Choose the question type and provide its details.
        </p>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="cbt-question-type"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Question Type
            </label>
            <select
              id="cbt-question-type"
              value={type}
              onChange={(event) =>
                changeType(event.target.value as QuestionType)
              }
              disabled={saving || Boolean(editingQuestion)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            >
              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              <option value="TRUE_FALSE">True / False</option>
              <option value="THEORY">Theory</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="cbt-question-prompt"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Question
            </label>
            <textarea
              id="cbt-question-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={3}
              required
              disabled={saving}
              placeholder="Enter the question..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="cbt-question-marks"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Marks
              </label>
              <input
                id="cbt-question-marks"
                type="number"
                min="0.01"
                step="any"
                value={marks}
                onChange={(event) => setMarks(event.target.value)}
                required
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="cbt-question-difficulty"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Difficulty
              </label>
              <select
                id="cbt-question-difficulty"
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as Difficulty)
                }
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          {type === "MULTIPLE_CHOICE" && (
            <div className="space-y-3 rounded-lg bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-slate-800">
                  Answer Options
                </h4>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={allowMultipleAnswers}
                    onChange={(event) =>
                      setAllowMultipleAnswers(event.target.checked)
                    }
                    disabled={saving || editingHasOptionImages}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Allow multiple correct answers
                </label>
              </div>

              {options.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2"
                >
                  <input
                    type={allowMultipleAnswers ? "checkbox" : "radio"}
                    name="cbt-correct-answer"
                    checked={option.isCorrect}
                    onChange={(event) =>
                      updateOption(index, "isCorrect", event.target.checked)
                    }
                    disabled={saving || editingHasOptionImages}
                    aria-label={`Option ${index + 1} is correct`}
                    className="h-4 w-4 shrink-0"
                  />
                  <input
                    type="text"
                    value={option.text}
                    onChange={(event) =>
                      updateOption(index, "text", event.target.value)
                    }
                    required
                    disabled={saving || editingHasOptionImages}
                    placeholder={`Option ${index + 1}`}
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      disabled={saving || editingHasOptionImages}
                      className="rounded-lg px-2 py-2 text-sm text-red-700 hover:bg-red-50"
                      aria-label={`Remove option ${index + 1}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addOption}
                disabled={saving || editingHasOptionImages}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white"
              >
                + Add Option
              </button>
              {editingHasOptionImages && (
                <p className="text-xs text-amber-700">
                  These options contain images. Their text and answers are
                  locked during this edit; other question details can still
                  be updated.
                </p>
              )}
              <p className="text-xs text-slate-500">
                Select the correct answer. You can choose more than one when
                multiple correct answers are enabled.
              </p>
            </div>
          )}

          {type === "TRUE_FALSE" && (
            <div className="space-y-3 rounded-lg bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-800">
                Correct Answer
              </h4>
              {options.map((option, index) => (
                <label
                  key={option.text}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="radio"
                    name="cbt-true-false-answer"
                    checked={option.isCorrect}
                    onChange={() => {
                      setOptions((current) =>
                        current.map((item, itemIndex) => ({
                          ...item,
                          isCorrect: itemIndex === index,
                        })),
                      );
                    }}
                    disabled={saving}
                    className="h-4 w-4"
                  />
                  {option.text}
                </label>
              ))}
            </div>
          )}

          {type === "THEORY" && (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              Theory questions are marked manually by a teacher.
            </p>
          )}

          <div>
            <label
              htmlFor="cbt-question-explanation"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Explanation (Optional)
            </label>
            <textarea
              id="cbt-question-explanation"
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              rows={2}
              disabled={saving}
              placeholder="Explain the correct answer..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !prompt.trim()}
            className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : editingQuestion ? "Save Changes" : "Add Question"}
          </button>
          {editingQuestion && (
            <button
              type="button"
              onClick={() => {
                setEditingQuestion(null);
                resetForm();
                setError("");
              }}
              disabled={saving}
              className="ml-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Questions</h3>
            <p className="mt-1 text-sm text-slate-500">
              {questions.length} question{questions.length === 1 ? "" : "s"}{" "}
              found
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(event) => setIncludeInactive(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Include inactive
            </label>
            <button
              type="button"
              onClick={() => void loadQuestions()}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Loading questions...
          </p>
        ) : questions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No questions found in this bank yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {questions.map((question, index) => (
              <article
                key={question.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Question {index + 1} ·{" "}
                    {question.type.replaceAll("_", " ")}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                      {question.marks} mark{question.marks === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                      {question.difficulty}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 ${
                        question.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {question.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm font-medium text-slate-900">
                  {question.prompt}
                </p>

                {question.options.length > 0 && (
                  <ol className="mt-3 space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <li
                        key={option.id}
                        className={`rounded-md px-3 py-2 text-sm ${
                          option.isCorrect
                            ? "bg-green-50 text-green-800"
                            : "bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span className="mr-2 font-medium">
                          {String.fromCharCode(65 + optionIndex)}.
                        </span>
                        {option.text}
                        {option.isCorrect && (
                          <span className="ml-2 text-xs font-semibold">
                            Correct
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                )}

                {question.explanation && (
                  <p className="mt-3 text-sm text-slate-600">
                    <span className="font-semibold">Explanation: </span>
                    {question.explanation}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  {question.isActive ? (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditing(question)}
                        disabled={saving}
                        className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                      >
                        Edit Question
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeactivate(question)}
                        disabled={saving}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">
                      This question is inactive and cannot be reactivated here.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


