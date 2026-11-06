import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import {
  getPlatformBillingOverview,
  saveSchoolBillingRate,
} from "@/lib/services/platform-billing.service";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

async function updateSchoolRate(formData: FormData) {
  "use server";

  const session = await requireRole([
    "PLATFORM_OWNER",
    "PLATFORM_ADMIN",
  ]);

  const schoolIdValue = formData.get("schoolId");
  const rateValue = formData.get("ratePerStudent");
  const notesValue = formData.get("notes");

  if (
    typeof schoolIdValue !== "string" ||
    !/^\d+$/.test(schoolIdValue) ||
    typeof rateValue !== "string"
  ) {
    throw new Error("Invalid billing rate details.");
  }

  const schoolId = Number(schoolIdValue);
  const ratePerStudent = Number(rateValue);

  if (!Number.isSafeInteger(schoolId) || schoolId <= 0) {
    throw new Error("Invalid school selected.");
  }

  if (
    !Number.isFinite(ratePerStudent) ||
    ratePerStudent <= 0
  ) {
    throw new Error("Enter a valid rate greater than zero.");
  }

  const notes =
    typeof notesValue === "string" ? notesValue.trim() : "";

  if (notes.length > 500) {
    throw new Error("Notes must not exceed 500 characters.");
  }

  const createdById = Number(session.user.id);

  if (!Number.isSafeInteger(createdById) || createdById <= 0) {
    throw new Error("Unable to identify the platform user.");
  }

  await saveSchoolBillingRate({
    schoolId,
    ratePerStudent,
    currency: "NGN",
    notes: notes || null,
    createdById,
  });

  redirect("/dashboard/billing/rates?saved=1");
}

function formatCurrency(value: unknown, currency = "NGN") {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "Not configured";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function BillingRatesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const [overview, params] = await Promise.all([
    getPlatformBillingOverview(),
    searchParams,
  ]);

  const rateBySchool = new Map(
    overview.rates.map((rate) => [rate.schoolId, rate]),
  );

  const configuredCount = overview.rates.filter(
    (rate) => rate.isActive,
  ).length;

  const activeSchools = overview.schools.filter(
    (school) => school.status === "ACTIVE",
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 transition hover:text-slate-900"
        >
          ← Dashboard
        </Link>

        <div className="mt-4">
          <p className="text-sm font-medium text-slate-500">
            Billing & Subscriptions
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            School Billing Rates
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Set the negotiated amount each school pays per active student
            for every academic term.
          </p>
        </div>
      </div>

      {params.saved === "1" && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          School billing rate saved successfully.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Schools
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {overview.schools.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Active Schools
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {activeSchools}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Configured Billing Rates
          </p>
          <p className="mt-2 text-3xl font-bold text-blue-700">
            {configuredCount}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <h2 className="font-semibold text-blue-950">
          How school billing works
        </h2>
        <p className="mt-2 text-sm leading-6 text-blue-900">
          Each school has its own negotiated rate. At the beginning of
          a billing term, the system counts that school's active students
          and multiplies the count by the configured rate.
        </p>
        <p className="mt-2 text-sm font-semibold text-blue-950">
          Invoice amount = Active students × Rate per student
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">
            School Rate Configuration
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Configure or update the billing rate for each registered school.
          </p>
        </div>

        {overview.schools.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <h3 className="font-semibold text-slate-900">
              No schools registered
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Register a school before configuring its billing rate.
            </p>
            <Link
              href="/dashboard/schools"
              className="mt-5 inline-flex rounded-lg bg-[#071d3a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#102f55]"
            >
              View Schools
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {overview.schools.map((school) => {
              const rate = rateBySchool.get(school.id);

              return (
                <div
                  key={school.id}
                  className="grid gap-6 px-5 py-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:px-6"
                >
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071d3a] text-sm font-bold text-amber-300">
                        {school.name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((word) => word[0])
                          .join("")
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900">
                          {school.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          School ID: {school.id}
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            school.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {formatStatus(school.status)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Current rate per active student
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {rate?.isActive
                          ? formatCurrency(
                              rate.ratePerStudent,
                              rate.currency,
                            )
                          : "Not configured"}
                      </p>
                      {rate?.notes && (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {rate.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <form
                    action={updateSchoolRate}
                    className="space-y-4 rounded-xl border border-slate-200 p-4 sm:p-5"
                  >
                    <input
                      type="hidden"
                      name="schoolId"
                      value={school.id}
                    />

                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {rate ? "Update billing rate" : "Set billing rate"}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Amount charged for each active student per term.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor={`rate-${school.id}`}
                        className={labelClass}
                      >
                        Rate per active student (₦)
                      </label>
                      <input
                        id={`rate-${school.id}`}
                        name="ratePerStudent"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        defaultValue={
                          rate?.isActive
                            ? String(rate.ratePerStudent)
                            : ""
                        }
                        placeholder="e.g. 500"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`notes-${school.id}`}
                        className={labelClass}
                      >
                        Notes (optional)
                      </label>
                      <textarea
                        id={`notes-${school.id}`}
                        name="notes"
                        rows={2}
                        maxLength={500}
                        defaultValue={rate?.notes ?? ""}
                        placeholder="Add any billing agreement details..."
                        className={inputClass}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-lg bg-[#071d3a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102f55]"
                      >
                        {rate ? "Update Rate" : "Save Rate"}
                      </button>
                    </div>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
