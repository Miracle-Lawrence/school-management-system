"use client";

import { useState } from "react";

type AcademicSessionOption = {
  id: number;
  name: string;
  isActive: boolean;
};

type TermOption = {
  id: number;
  sessionId: number;
  name: string;
  isActive: boolean;
};

type ResultPeriodSelectorProps = {
  academicSessions: AcademicSessionOption[];
  terms: TermOption[];
  classes: {
    id: number;
    name: string;
    level: string | null;
  }[];
};

export default function ResultPeriodSelector({
  academicSessions,
  terms,
  classes,
}: ResultPeriodSelectorProps) {
  const activeSession = academicSessions.find((item) => item.isActive);

  const [sessionId, setSessionId] = useState(
    activeSession?.id.toString() ?? "",
  );

  const [termId, setTermId] = useState("");

  const availableTerms = terms.filter(
    (term) => term.sessionId.toString() === sessionId,
  );

  return (
    <form
      action="/school/results/view"
      method="GET"
      className="mt-6 grid gap-5 sm:grid-cols-2"
    >
      <div>
        <label
          htmlFor="reportType"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Report Type
        </label>

        <select
          id="reportType"
          name="reportType"
          required
          defaultValue="TERMINAL"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="MID_TERM">Mid-Term</option>
          <option value="TERMINAL">Terminal</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="sessionId"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Academic Session
        </label>

        <select
          id="sessionId"
          name="sessionId"
          required
          value={sessionId}
          onChange={(event) => {
            setSessionId(event.target.value);
            setTermId("");
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="" disabled>
            Select academic session
          </option>

          {academicSessions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.isActive ? " (Active)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="classId"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Class
        </label>

        <select
          id="classId"
          name="classId"
          required
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="" disabled>
            Select class
          </option>

          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.level ? ` (${item.level})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="termId"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Term
        </label>

        <select
          id="termId"
          name="termId"
          required
          value={termId}
          onChange={(event) => setTermId(event.target.value)}
          disabled={!sessionId || availableTerms.length === 0}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="" disabled>
            {!sessionId
              ? "Select academic session first"
              : availableTerms.length === 0
                ? "No terms available"
                : "Select term"}
          </option>

          {availableTerms.map((term) => (
            <option key={term.id} value={term.id}>
              {term.name}
              {term.isActive ? " (Active)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={
            !sessionId ||
            !termId ||
            academicSessions.length === 0 ||
            classes.length === 0
          }
          className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
        >
          View Results
        </button>
      </div>
    </form>
  );
}
