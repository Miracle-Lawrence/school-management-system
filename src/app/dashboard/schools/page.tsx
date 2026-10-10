import Link from "next/link";
import { db } from "@/prisma/db";

function getStatusStyle(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "SUSPENDED":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    case "INACTIVE":
      return "bg-slate-100 text-slate-600 ring-slate-500/20";
    default:
      return "bg-gray-100 text-gray-700 ring-gray-500/20";
  }
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function SchoolsPage() {
  const schools = await db.orm.public.School.all();

  const activeCount = schools.filter(
    (school) => school.status === "ACTIVE",
  ).length;

  const suspendedCount = schools.filter(
    (school) => school.status === "SUSPENDED",
  ).length;

  const inactiveCount = schools.filter(
    (school) => school.status === "INACTIVE",
  ).length;

  const summaryCards = [
    {
      label: "Total Schools",
      value: schools.length,
      color: "text-slate-900",
      accent: "bg-slate-900",
    },
    {
      label: "Active",
      value: activeCount,
      color: "text-emerald-700",
      accent: "bg-emerald-500",
    },
    {
      label: "Suspended",
      value: suspendedCount,
      color: "text-amber-700",
      accent: "bg-amber-500",
    },
    {
      label: "Inactive",
      value: inactiveCount,
      color: "text-slate-600",
      accent: "bg-slate-400",
    },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Platform Administration
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Schools
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            View and manage schools registered on your platform.
          </p>
        </div>

        <Link
          href="/dashboard/schools/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#071d3a] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102f55]"
        >
          <span aria-hidden="true" className="text-lg">
            +
          </span>
          Add School
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className={`absolute inset-y-0 left-0 w-1 ${card.accent}`} />
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className={`mt-3 text-3xl font-bold ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Registered Schools
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {schools.length} {schools.length === 1 ? "school" : "schools"} on
            the platform
          </p>
        </div>

        {schools.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-500">
              +
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              No schools registered yet
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Register your first school to begin managing it from the platform
              portal.
            </p>
            <Link
              href="/dashboard/schools/new"
              className="mt-5 inline-flex rounded-lg bg-[#071d3a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#102f55]"
            >
              Register a School
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold sm:px-6">School</th>
                  <th className="px-5 py-4 font-semibold">Location</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold sm:px-6">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {schools.map((school) => (
                  <tr
                    key={school.id}
                    className="transition hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071d3a] text-sm font-bold text-amber-300">
                          {school.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((word) => word[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {school.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {school.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {[school.city, school.country]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(school.status)}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {formatStatus(school.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right sm:px-6">
                      <Link
                        href={`/dashboard/schools/${school.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                      >
                        Manage
                        <span aria-hidden="true">→</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
