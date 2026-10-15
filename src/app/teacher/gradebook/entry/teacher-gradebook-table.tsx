"use client";

import { useState } from "react";

type AssessmentRow = {
  id: number;
  title: string;
  type: string;
  maxScore: number;
};

type StudentRow = {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  admissionNumber: string;
};

type ExistingScoreRow = {
  assessmentId: number;
  studentId: number;
  score: number;
};

type TeacherGradebookTableProps = {
  classId: number;
  subjectId: number;
  termId: number;
  configurationId: number;
  assessments: AssessmentRow[];
  students: StudentRow[];
  existingScores: ExistingScoreRow[];
};

export default function TeacherGradebookTable({
  classId,
  subjectId,
  termId,
  configurationId,
  assessments,
  students,
  existingScores,
}: TeacherGradebookTableProps) {
  const [scores, setScores] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};

    for (const item of existingScores) {
      initial[`${item.assessmentId}:${item.studentId}`] = String(item.score);
    }

    return initial;
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  function updateScore(assessmentId: number, studentId: number, value: string) {
    const key = `${assessmentId}:${studentId}`;

    setScores((current) => ({
      ...current,
      [key]: value,
    }));

    setMessage("");
    setMessageType("");
  }

  async function saveScores() {
    if (saving) return;

    setMessage("");
    setMessageType("");

    const entries: {
      assessmentId: number;
      studentId: number;
      score: number;
    }[] = [];

    for (const student of students) {
      for (const assessment of assessments) {
        const key = `${assessment.id}:${student.id}`;
        const value = scores[key]?.trim() ?? "";

        // Blank fields are not submitted and do not erase existing scores.
        if (value === "") continue;

        const score = Number(value);

        if (!Number.isFinite(score) || score < 0) {
          setMessage(
            `Enter a valid non-negative score for ${student.firstName} ${student.lastName}.`,
          );
          setMessageType("error");
          return;
        }

        if (score > assessment.maxScore) {
          setMessage(
            `${student.firstName} ${student.lastName}: "${assessment.title}" cannot exceed ${assessment.maxScore}.`,
          );
          setMessageType("error");
          return;
        }

        entries.push({
          assessmentId: assessment.id,
          studentId: student.id,
          score,
        });
      }
    }

    if (entries.length === 0) {
      setMessage("Enter at least one score before saving.");
      setMessageType("error");
      return;
    }

    if (entries.length > 5000) {
      setMessage(
        "This save contains more than 5,000 scores. Save the gradebook in smaller batches.",
      );
      setMessageType("error");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/teacher/gradebook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId,
          subjectId,
          termId,
          configurationId,
          scores: entries,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
        savedCount?: number;
      };

      if (!response.ok) {
        setMessage(result.message ?? "Unable to save scores.");
        setMessageType("error");
        return;
      }

      setMessage(
        `${result.message ?? "Scores saved."} ${result.savedCount ?? 0} score(s) saved.`,
      );
      setMessageType("success");
    } catch {
      setMessage(
        "A network error occurred. Please check your connection and try again.",
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Enter student scores</h3>
          <p className="mt-1 text-sm text-slate-600">
            Existing scores are prefilled. Leave a field blank to leave that
            score unchanged.
          </p>
        </div>

        <button
          type="button"
          onClick={saveScores}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving scores..." : "Save all scores"}
        </button>
      </div>

      {message && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-lg border p-3 text-sm ${
            messageType === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="sticky left-0 z-10 min-w-[200px] bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                Student
              </th>

              <th className="min-w-[140px] px-4 py-3 font-semibold text-slate-700">
                Admission number
              </th>

              {assessments.map((assessment) => (
                <th
                  key={assessment.id}
                  className="min-w-[160px] px-4 py-3 font-semibold text-slate-700"
                >
                  <div>{assessment.title}</div>
                  <div className="mt-1 text-xs font-normal text-slate-500">
                    {assessment.type.replaceAll("_", " ")} · Max{" "}
                    {assessment.maxScore}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50">
                <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3 font-medium text-slate-900">
                  {student.lastName}, {student.firstName}
                  {student.middleName ? ` ${student.middleName}` : ""}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {student.admissionNumber}
                </td>

                {assessments.map((assessment) => {
                  const key = `${assessment.id}:${student.id}`;
                  const value = scores[key] ?? "";

                  return (
                    <td key={assessment.id} className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max={assessment.maxScore}
                        step="any"
                        inputMode="decimal"
                        aria-label={`${assessment.title} score for ${student.firstName} ${student.lastName}`}
                        value={value}
                        onChange={(event) =>
                          updateScore(
                            assessment.id,
                            student.id,
                            event.target.value,
                          )
                        }
                        disabled={saving}
                        placeholder="—"
                        className="w-24 rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                      />
                      <span className="ml-2 text-xs text-slate-500">
                        / {assessment.maxScore}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveScores}
          disabled={saving}
          className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving scores..." : "Save all scores"}
        </button>
      </div>
    </div>
  );
}
