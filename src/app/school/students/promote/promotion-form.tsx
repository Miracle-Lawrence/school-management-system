"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";

type PromotionFormState = {
  error: string | null;
};

type PromotionClass = {
  id: number;
  name: string;
};

type PromotionStudent = {
  id: number;
  admissionNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string;
};

type PromotionFormProps = {
  action: (
    previousState: PromotionFormState,
    formData: FormData,
  ) => Promise<PromotionFormState>;
  classes: PromotionClass[];
  successMessage: string | null;
};

export default function PromotionForm({
  action,
  classes,
  successMessage,
}: PromotionFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    error: null,
  });

  const [fromClassId, setFromClassId] = useState("");
  const [students, setStudents] = useState<PromotionStudent[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    if (!fromClassId) {
      setStudents([]);
      setSelectedStudents([]);
      return;
    }

    async function loadStudents() {
      setLoadingStudents(true);

      try {
        const response = await fetch(
          `/api/school/students?classId=${fromClassId}`,
        );

        if (!response.ok) {
          throw new Error("Unable to load students.");
        }

        const data = await response.json();

        setStudents(data.students ?? []);
        setSelectedStudents([]);
      } catch {
        setStudents([]);
        setSelectedStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    }

    loadStudents();
  }, [fromClassId]);

  const allSelected =
    students.length > 0 && selectedStudents.length === students.length;

  function toggleStudent(studentId: number) {
    setSelectedStudents((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((student) => student.id));
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {state.error}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
        >
          {successMessage}
        </div>
      )}

      <div className="grid gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div>
          <label
            htmlFor="fromClassId"
            className="block text-sm font-semibold text-slate-800"
          >
            Current Class
          </label>

          <select
            id="fromClassId"
            name="fromClassId"
            value={fromClassId}
            onChange={(event) => setFromClassId(event.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select current class</option>

            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="toClassId"
            className="block text-sm font-semibold text-slate-800"
          >
            Destination Class
          </label>

          <select
            id="toClassId"
            name="toClassId"
            required
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select destination class</option>

            {classes.map((schoolClass) => (
              <option
                key={schoolClass.id}
                value={schoolClass.id}
                disabled={String(schoolClass.id) === fromClassId}
              >
                {schoolClass.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {fromClassId && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Students</h2>

              <p className="mt-1 text-sm text-slate-600">
                {loadingStudents
                  ? "Loading students..."
                  : `${students.length} student${
                      students.length === 1 ? "" : "s"
                    } in this class`}
              </p>
            </div>

            {!loadingStudents && students.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="w-fit rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>

          {loadingStudents ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Loading students...
            </div>
          ) : students.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-700">
                No students are assigned to this class.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Select another class to continue.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="w-12 px-6 py-4">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Admission No.
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Student
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Gender
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const selected = selectedStudents.includes(student.id);

                    return (
                      <tr
                        key={student.id}
                        className={`transition ${
                          selected ? "bg-blue-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            name="studentIds"
                            value={student.id}
                            checked={selected}
                            onChange={() => toggleStudent(student.id)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>

                        <td className="px-6 py-4 font-medium text-slate-700">
                          {student.admissionNumber}
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {student.firstName}{" "}
                          {student.middleName ? `${student.middleName} ` : ""}
                          {student.lastName}
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {student.gender}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {students.length > 0 && (
        <div className="flex flex-col gap-4 rounded-xl border border-blue-100 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-900">
              {selectedStudents.length} student
              {selectedStudents.length === 1 ? "" : "s"} selected
            </p>

            <p className="mt-1 text-sm text-blue-700">
              Only selected students will be moved to the destination class.
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending || selectedStudents.length === 0}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Promoting..." : "Promote Selected Students"}
          </button>
        </div>
      )}
    </form>
  );
}
