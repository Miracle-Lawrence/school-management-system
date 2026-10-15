"use client";

import { useMemo, useState } from "react";

type ClassSubjectOption = {
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
};

type TermOption = {
  id: number;
  name: string;
  sessionName: string;
};

type ReportOption = {
  id: number;
  reportType: "MID_TERM" | "TERMINAL";
  name: string;
};

type GradebookSelectorProps = {
  assignments: ClassSubjectOption[];
  terms: TermOption[];
  configurations: ReportOption[];
};

export default function GradebookSelector({
  assignments,
  terms,
  configurations,
}: GradebookSelectorProps) {
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [termId, setTermId] = useState("");
  const [configurationId, setConfigurationId] = useState("");

  const classes = useMemo(() => {
    const unique = new Map<number, string>();

    assignments.forEach((assignment) => {
      unique.set(assignment.classId, assignment.className);
    });

    return [...unique.entries()].map(([id, name]) => ({ id, name }));
  }, [assignments]);

  const subjects = useMemo(
    () =>
      assignments
        .filter(
          (assignment) =>
            classId !== "" && assignment.classId === Number(classId),
        )
        .map((assignment) => ({
          id: assignment.subjectId,
          name: assignment.subjectName,
        })),
    [assignments, classId],
  );

  const canContinue =
    classId !== "" &&
    subjectId !== "" &&
    termId !== "" &&
    configurationId !== "";

  function handleClassChange(value: string) {
    setClassId(value);
    setSubjectId("");
  }

  function handleContinue() {
    if (!canContinue) return;

    const query = new URLSearchParams({
      classId,
      subjectId,
      termId,
      configurationId,
    });

    window.location.href = `/teacher/gradebook/entry?${query.toString()}`;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-lg font-bold text-slate-900">Select gradebook</h2>
      <p className="mt-1 text-sm text-slate-600">
        Choose an assigned class and subject, an academic term, and the exact
        report configuration whose assessment fields you want to enter.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Class">
          <select
            value={classId}
            onChange={(event) => handleClassChange(event.target.value)}
            className={selectClassName}
          >
            <option value="">Select class</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Subject">
          <select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            disabled={!classId}
            className={selectClassName}
          >
            <option value="">Select subject</option>
            {subjects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Academic term">
          <select
            value={termId}
            onChange={(event) => setTermId(event.target.value)}
            className={selectClassName}
          >
            <option value="">Select term</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name} — {term.sessionName}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Report configuration">
          <select
            value={configurationId}
            onChange={(event) => setConfigurationId(event.target.value)}
            className={selectClassName}
          >
            <option value="">Select report configuration</option>
            {configurations.map((configuration) => (
              <option key={configuration.id} value={configuration.id}>
                {configuration.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
        <p className="text-xs leading-5 text-slate-500">
          Your class-subject assignment and report configuration will be checked
          on the server before scores can be accessed or saved.
        </p>

        <button
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Open gradebook
        </button>
      </div>
    </section>
  );
}

const selectClassName =
  "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
