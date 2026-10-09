"use client";

import { useRouter, useSearchParams } from "next/navigation";

type StudentFiltersProps = {
  classes: {
    id: number;
    name: string;
  }[];
};

export default function StudentFilters({ classes }: StudentFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") || "active";
  const classId = searchParams.get("classId") || "";

  function updateFilter(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    router.push(`/school/students?${params.toString()}`);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="student-status"
            className="block text-sm font-semibold text-slate-800"
          >
            Student Status
          </label>

          <select
            id="student-status"
            value={status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="active">Active Students</option>
            <option value="inactive">Inactive Students</option>
            <option value="all">All Students</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="student-class"
            className="block text-sm font-semibold text-slate-800"
          >
            Class
          </label>

          <select
            id="student-class"
            value={classId}
            onChange={(event) => updateFilter("classId", event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Classes</option>

            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
