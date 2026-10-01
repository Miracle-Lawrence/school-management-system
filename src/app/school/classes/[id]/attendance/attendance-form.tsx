"use client";

import { useEffect, useState } from "react";

type Student = {
  id: number;
  admissionNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
};

type AttendanceFormProps = {
  students: Student[];
  classId: number;
  termId: number;
};

const statuses = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;

type AttendanceStatus = (typeof statuses)[number];

export default function AttendanceForm({
  students,
  classId,
  termId,
}: AttendanceFormProps) {
  const [date, setDate] = useState("");
  const [attendance, setAttendance] = useState<
    Record<number, AttendanceStatus>
  >({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!date) {
      setAttendance({});
      return;
    }

    async function loadAttendance() {
      setLoading(true);
      setError("");
      setMessage("");

      try {
        const response = await fetch(
          `/api/school/attendance?classId=${classId}&termId=${termId}&date=${date}`,
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load attendance.");
        }

        const existingAttendance: Record<number, AttendanceStatus> = {};

        for (const record of data.records) {
          existingAttendance[record.studentId] = record.status;
        }

        setAttendance(existingAttendance);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load attendance.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, [date, classId, termId]);

  function updateStatus(studentId: number, status: AttendanceStatus) {
    setAttendance((current) => ({
      ...current,
      [studentId]: status,
    }));
  }

  function markAllPresent() {
    const updatedAttendance: Record<number, AttendanceStatus> = {};

    for (const student of students) {
      updatedAttendance[student.id] = "PRESENT";
    }

    setAttendance(updatedAttendance);
  }

  function markAllAbsent() {
    const updatedAttendance: Record<number, AttendanceStatus> = {};

    for (const student of students) {
      updatedAttendance[student.id] = "ABSENT";
    }

    setAttendance(updatedAttendance);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!date) {
      setError("Please select a date.");
      return;
    }

    if (students.length === 0) {
      setError("There are no students in this class.");
      return;
    }

    const records = students.map((student) => ({
      studentId: student.id,
      status: attendance[student.id] ?? "PRESENT",
    }));

    setSaving(true);

    try {
      const response = await fetch("/api/school/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId,
          termId,
          date,
          records,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save attendance.");
      }

      setMessage("Attendance has been saved successfully.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save attendance.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date and quick actions */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <label
            htmlFor="attendance-date"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Attendance Date <span className="text-red-500">*</span>
          </label>

          <input
            id="attendance-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            disabled={loading || saving}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
          />

          <p className="mt-2 text-xs text-slate-500">
            Select the date you want to record attendance for.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={markAllPresent}
            disabled={loading || saving || students.length === 0}
            className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark All Present
          </button>

          <button
            type="button"
            onClick={markAllAbsent}
            disabled={loading || saving || students.length === 0}
            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-700">
            Loading attendance for the selected date...
          </p>
        </div>
      )}

      {/* Student attendance table */}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Admission Number
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Student
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Attendance Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {students.map((student) => {
                const currentStatus = attendance[student.id] ?? "PRESENT";

                return (
                  <tr key={student.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {student.admissionNumber}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                          {`${student.firstName.charAt(
                            0,
                          )}${student.lastName.charAt(0)}`.toUpperCase()}
                        </span>

                        <span className="font-semibold text-slate-900">
                          {student.firstName}{" "}
                          {student.middleName ? `${student.middleName} ` : ""}
                          {student.lastName}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={currentStatus}
                        onChange={(event) =>
                          updateStatus(
                            student.id,
                            event.target.value as AttendanceStatus,
                          )
                        }
                        disabled={loading || saving}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-medium text-green-700">{message}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Students without a manually selected status will be marked as Present.
        </p>

        <button
          type="submit"
          disabled={saving || loading || students.length === 0}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving Attendance..." : "Save Attendance"}
        </button>
      </div>
    </form>
  );
}
