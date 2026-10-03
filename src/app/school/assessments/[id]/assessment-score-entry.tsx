"use client";

import { useState } from "react";

type Student = {
  id: number;
  admissionNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
};

type ExistingScore = {
  studentId: number;
  score: number;
  remarks: string | null;
};

type ScoreDraft = {
  score: string;
  remarks: string;
};

type AssessmentScoreEntryProps = {
  assessmentId: number;
  maxScore: number;
  students: Student[];
  existingScores: ExistingScore[];
};

export default function AssessmentScoreEntry({
  assessmentId,
  maxScore,
  students,
  existingScores,
}: AssessmentScoreEntryProps) {
  const [drafts, setDrafts] = useState<Record<number, ScoreDraft>>(() =>
    Object.fromEntries(
      students.map((student) => {
        const existing = existingScores.find(
          (item) => item.studentId === student.id,
        );

        return [
          student.id,
          {
            score: existing ? String(existing.score) : "",
            remarks: existing?.remarks ?? "",
          },
        ];
      }),
    ),
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const gradedCount = students.filter(
    (student) => drafts[student.id]?.score.trim() !== "",
  ).length;

  const pendingCount = students.length - gradedCount;

  function updateDraft(
    studentId: number,
    field: keyof ScoreDraft,
    value: string,
  ) {
    setDrafts((previous) => ({
      ...previous,
      [studentId]: {
        ...previous[studentId],
        [field]: value,
      },
    }));

    setErrors((previous) => ({
      ...previous,
      [studentId]: "",
    }));

    setMessage("");
    setSavedCount(null);
  }

  async function handleSaveAll() {
    setMessage("");
    setSavedCount(null);

    const nextErrors: Record<number, string> = {};

    for (const student of students) {
      const draft = drafts[student.id];
      const value = draft?.score.trim() ?? "";

      if (value === "") {
        continue;
      }

      const numericScore = Number(value);

      if (!Number.isFinite(numericScore)) {
        nextErrors[student.id] = "Enter a valid score.";
      } else if (numericScore < 0 || numericScore > maxScore) {
        nextErrors[student.id] = `Score must be between 0 and ${maxScore}.`;
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setMessage("Please correct the highlighted scores.");
      return;
    }

    const studentsToSave = students.filter(
      (student) => drafts[student.id]?.score.trim() !== "",
    );

    if (studentsToSave.length === 0) {
      setMessage("Enter at least one score before saving.");
      return;
    }

    setSaving(true);

    const results = await Promise.all(
      studentsToSave.map(async (student) => {
        const draft = drafts[student.id];

        try {
          const response = await fetch(
            `/api/school/assessments/${assessmentId}/scores`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                studentId: student.id,
                score: Number(draft.score),
                remarks: draft.remarks,
              }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to save score.");
          }

          return {
            studentId: student.id,
            success: true,
            error: "",
          };
        } catch (error) {
          return {
            studentId: student.id,
            success: false,
            error:
              error instanceof Error ? error.message : "Failed to save score.",
          };
        }
      }),
    );

    const failedResults = results.filter((item) => !item.success);
    const successfulCount = results.length - failedResults.length;

    const failedErrors = Object.fromEntries(
      failedResults.map((item) => [item.studentId, item.error]),
    );

    setErrors(failedErrors);
    setSavedCount(successfulCount);

    if (failedResults.length === 0) {
      setMessage(
        `Successfully saved scores for ${successfulCount} student(s).`,
      );
    } else {
      setMessage(
        `${successfulCount} saved successfully; ${failedResults.length} failed. Please review the errors.`,
      );
    }

    setSaving(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Student Scores</h2>

        <p className="mt-1 text-sm text-gray-500">
          Enter scores out of {maxScore}. Leave a score blank if the student has
          not been graded.
        </p>
      </div>

      

      {students.length === 0 ? (
        <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
          No students are currently assigned to this class.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Admission Number</th>
                  <th className="px-4 py-3 font-medium">Student Name</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Remarks</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {students.map((student) => {
                  const fullName = [
                    student.firstName,
                    student.middleName,
                    student.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  const draft = drafts[student.id];

                  return (
                    <tr key={student.id}>
                      <td className="px-4 py-3 font-medium text-gray-700">
                        {student.admissionNumber}
                      </td>

                      <td className="px-4 py-3 text-gray-900">{fullName}</td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max={maxScore}
                          step="any"
                          value={draft?.score ?? ""}
                          onChange={(event) =>
                            updateDraft(student.id, "score", event.target.value)
                          }
                          className="w-24 rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          aria-label={`Score for ${fullName}`}
                        />

                        {errors[student.id] && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors[student.id]}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={draft?.remarks ?? ""}
                          onChange={(event) =>
                            updateDraft(
                              student.id,
                              "remarks",
                              event.target.value,
                            )
                          }
                          placeholder="Optional"
                          className="w-full min-w-36 rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          aria-label={`Remarks for ${fullName}`}
                        />
                      </td>

                      <td className="px-4 py-3">
                        {errors[student.id] ? (
                          <span className="text-xs font-medium text-red-600">
                            Error
                          </span>
                        ) : draft?.score.trim() ? (
                          <span className="text-xs font-medium text-green-600">
                            Entered
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              {gradedCount} of {students.length} students have scores entered.
            </p>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving || gradedCount === 0}
              className="rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving Scores..." : "Save All Scores"}
            </button>
          </div>

          {message && (
            <p
              role="status"
              className={`rounded-md p-3 text-sm ${
                savedCount !== null && savedCount > 0
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </p>
          )}
        </>
      )}
    </div>
  );
}
