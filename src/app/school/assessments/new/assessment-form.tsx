"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ClassOption = {
  id: number;
  name: string;
};

type SubjectOption = {
  id: number;
  name: string;
};

type AssignmentOption = {
  classId: number;
  subjectId: number;
};

type TermOption = {
  id: number;
  name: string;
  sessionName: string;
};

const assessmentTypes = [
  "ASSIGNMENT",
  "TEST",
  "CA",
  "EXAM",
  "PROJECT",
  "PRACTICAL",
  "OTHER",
] as const;

type AssessmentType = (typeof assessmentTypes)[number];

type AssessmentCategoryOption = {
  id: number;
  name: string;
  type: AssessmentType;
  displayOrder: number;
};

type AssessmentFormProps = {
  classes: ClassOption[];
  subjects: SubjectOption[];
  assignments: AssignmentOption[];
  terms: TermOption[];
  categories: AssessmentCategoryOption[];
  assessment?: {
    id: number;
    classId: number;
    subjectId: number;
    termId: number;
    title: string;
    type: AssessmentType;
    assessmentCategoryId: number | null;
    maxScore: number;
    weight: number;
    date: string | null;
    description: string | null;
  };
};

export default function AssessmentForm({
  classes,
  subjects,
  assignments,
  terms,
  categories,
  assessment,
}: AssessmentFormProps) {
  const router = useRouter();

  const [classId, setClassId] = useState(
    assessment ? String(assessment.classId) : "",
  );

  const [subjectId, setSubjectId] = useState(
    assessment ? String(assessment.subjectId) : "",
  );

  const [termId, setTermId] = useState(
    assessment ? String(assessment.termId) : "",
  );

  const [title, setTitle] = useState(assessment?.title ?? "");

  const [type, setType] = useState<AssessmentType>(assessment?.type ?? "CA");

  const [assessmentCategoryId, setAssessmentCategoryId] = useState(
    assessment?.assessmentCategoryId != null
      ? String(assessment.assessmentCategoryId)
      : "",
  );

  const [maxScore, setMaxScore] = useState(
    assessment ? String(assessment.maxScore) : "20",
  );

  const [weight, setWeight] = useState(
    assessment ? String(assessment.weight) : "1",
  );

  const [date, setDate] = useState(
    assessment?.date
      ? new Date(assessment.date).toISOString().slice(0, 10)
      : "",
  );

  const [description, setDescription] = useState(assessment?.description ?? "");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableSubjects = useMemo(() => {
    const assignedIds = assignments
      .filter((assignment) => String(assignment.classId) === classId)
      .map((assignment) => assignment.subjectId);

    return subjects.filter((subject) => assignedIds.includes(subject.id));
  }, [assignments, classId, subjects]);

  const availableCategories = useMemo(
    () =>
      categories
        .filter((category) => category.type === type)
        .sort(
          (a, b) =>
            a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
        ),
    [categories, type],
  );

  function handleClassChange(value: string) {
    setClassId(value);
    setSubjectId("");
  }

  function handleTypeChange(value: string) {
    const nextType = value as AssessmentType;

    setType(nextType);

    const selectedCategory = categories.find(
      (category) => String(category.id) === assessmentCategoryId,
    );

    if (selectedCategory?.type !== nextType) {
      setAssessmentCategoryId("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!classId || !subjectId || !termId || !title.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    const parsedMaxScore = Number(maxScore);
    const parsedWeight = Number(weight);

    if (
      !Number.isFinite(parsedMaxScore) ||
      parsedMaxScore <= 0 ||
      !Number.isFinite(parsedWeight) ||
      parsedWeight <= 0
    ) {
      setError("Maximum score and weight must be greater than zero.");
      return;
    }

    if (
      assessmentCategoryId &&
      !availableCategories.some(
        (category) => String(category.id) === assessmentCategoryId,
      )
    ) {
      setError("Please select a valid category for this assessment type.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        assessment
          ? `/api/school/assessments/${assessment.id}`
          : "/api/school/assessments",
        {
          method: assessment ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classId: Number(classId),
            subjectId: Number(subjectId),
            termId: Number(termId),
            title: title.trim(),
            type,
            assessmentCategoryId: assessmentCategoryId
              ? Number(assessmentCategoryId)
              : null,
            maxScore: parsedMaxScore,
            weight: parsedWeight,
            date: date || "",
            description: description.trim(),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Unable to ${assessment ? "update" : "create"} assessment.`,
        );
      }

      router.push("/school/assessments");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while saving the assessment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="classId"
            className="text-sm font-medium text-gray-700"
          >
            Class *
          </label>

          <select
            id="classId"
            value={classId}
            onChange={(event) => handleClassChange(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select class</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="subjectId"
            className="text-sm font-medium text-gray-700"
          >
            Subject *
          </label>

          <select
            id="subjectId"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            required
            disabled={!classId || availableSubjects.length === 0}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
          >
            <option value="">Select subject</option>
            {availableSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          {classId && availableSubjects.length === 0 && (
            <p className="text-xs text-amber-600">
              No subjects have been assigned to this class.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="termId" className="text-sm font-medium text-gray-700">
            Academic Term *
          </label>

          <select
            id="termId"
            value={termId}
            onChange={(event) => setTermId(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select active term</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.sessionName} - {term.name}
              </option>
            ))}
          </select>

          {terms.length === 0 && (
            <p className="text-xs text-amber-600">
              No active academic term is available.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium text-gray-700">
            Assessment Type *
          </label>

          <select
            id="type"
            value={type}
            onChange={(event) => handleTypeChange(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {assessmentTypes.map((assessmentType) => (
              <option key={assessmentType} value={assessmentType}>
                {assessmentType.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="assessmentCategoryId"
            className="text-sm font-medium text-gray-700"
          >
            Assessment Category
          </label>

          <select
            id="assessmentCategoryId"
            value={assessmentCategoryId}
            onChange={(event) => setAssessmentCategoryId(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">No category</option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {availableCategories.length === 0 && (
            <p className="text-xs text-gray-500">
              No active categories are configured for this assessment type.
            </p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="title" className="text-sm font-medium text-gray-700">
            Assessment Title *
          </label>

          <input
            id="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. First Continuous Assessment"
            maxLength={100}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="maxScore"
            className="text-sm font-medium text-gray-700"
          >
            Maximum Score *
          </label>

          <input
            id="maxScore"
            type="number"
            min="0.01"
            step="any"
            value={maxScore}
            onChange={(event) => setMaxScore(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="weight" className="text-sm font-medium text-gray-700">
            Assessment Weight *
          </label>

          <input
            id="weight"
            type="number"
            min="0.01"
            step="any"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="date" className="text-sm font-medium text-gray-700">
            Assessment Date
          </label>

          <input
            id="date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor="description"
            className="text-sm font-medium text-gray-700"
          >
            Description
          </label>

          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Optional assessment instructions..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/school/assessments")}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting || terms.length === 0}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Saving..."
            : assessment
              ? "Update Assessment"
              : "Create Assessment"}
        </button>
      </div>
    </form>
  );
}
