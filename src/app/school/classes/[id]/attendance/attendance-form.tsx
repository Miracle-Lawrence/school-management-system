"use client";

import { useState } from "react";

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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateStatus(studentId: number, status: AttendanceStatus) {
    setAttendance((current) => ({
      ...current,
      [studentId]: status,
    }));
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

      setMessage("Attendance has been recorded successfully.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save attendance.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-white p-6 shadow-sm"
    >
      <div className="mb-6">
        <label htmlFor="attendance-date" className="block text-sm font-medium">
          Attendance Date
        </label>

        <input
          id="attendance-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="mt-2 rounded-md border px-3 py-2"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-3">Admission Number</th>

              <th className="px-3 py-3">Student</th>

              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => {
              const currentStatus = attendance[student.id] ?? "PRESENT";

              return (
                <tr key={student.id} className="border-b">
                  <td className="px-3 py-3">{student.admissionNumber}</td>

                  <td className="px-3 py-3 font-medium">
                    {student.firstName}{" "}
                    {student.middleName ? `${student.middleName} ` : ""}
                    {student.lastName}
                  </td>

                  <td className="px-3 py-3">
                    <select
                      value={currentStatus}
                      onChange={(event) =>
                        updateStatus(
                          student.id,
                          event.target.value as AttendanceStatus,
                        )
                      }
                      className="rounded-md border px-3 py-2"
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

      {error && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-6 rounded-md bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Attendance"}
      </button>
    </form>
  );
}
