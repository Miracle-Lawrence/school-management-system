import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

async function createSubscriptionPlan(formData: FormData) {
  "use server";

  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const nameValue = formData.get("name");
  const descriptionValue = formData.get("description");
  const priceValue = formData.get("price");
  const intervalValue = formData.get("billingInterval");
  const studentsValue = formData.get("maxStudents");
  const teachersValue = formData.get("maxTeachers");
  const storageValue = formData.get("maxStorageMb");
  const featuresValue = formData.get("features");

  if (
    typeof nameValue !== "string" ||
    typeof priceValue !== "string" ||
    typeof intervalValue !== "string"
  ) {
    throw new Error("Invalid subscription plan details.");
  }

  const name = nameValue.trim();
  const price = Number(priceValue);

  if (!name || name.length > 100) {
    throw new Error(
      "Plan name is required and must not exceed 100 characters.",
    );
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Enter a valid, non-negative plan price.");
  }

  if (!["MONTHLY", "QUARTERLY", "YEARLY"].includes(intervalValue)) {
    throw new Error("Select a valid billing interval.");
  }

  function parseLimit(value: FormDataEntryValue | null, label: string) {
    if (value === null || value === "") return null;

    if (typeof value !== "string" || !/^\d+$/.test(value)) {
      throw new Error(
        `${label} must be a positive whole number or left blank.`,
      );
    }

    const number = Number(value);

    if (!Number.isSafeInteger(number) || number <= 0) {
      throw new Error(
        `${label} must be a positive whole number or left blank.`,
      );
    }

    return number;
  }

  const maxStudents = parseLimit(studentsValue, "Student limit");
  const maxTeachers = parseLimit(teachersValue, "Teacher limit");
  const maxStorageMb = parseLimit(storageValue, "Storage limit");

  const description =
    typeof descriptionValue === "string" ? descriptionValue.trim() : "";

  if (description.length > 1000) {
    throw new Error("Description must not exceed 1,000 characters.");
  }

  const features =
    typeof featuresValue === "string"
      ? [
          ...new Set(
            featuresValue
              .split(/\r?\n/)
              .map((feature) => feature.trim())
              .filter(Boolean),
          ),
        ]
      : [];

  if (
    features.length > 30 ||
    features.some((feature) => feature.length > 150)
  ) {
    throw new Error(
      "A plan can have up to 30 features, each up to 150 characters.",
    );
  }

  await db.orm.public.SubscriptionPlan.create({
    name,
    description: description || null,
    price: String(price),
    currency: "NGN",
    billingInterval: intervalValue as "MONTHLY" | "QUARTERLY" | "YEARLY",
    maxStudents,
    maxTeachers,
    maxStorageMb,
    features,
    isActive: true,
  });

  redirect("/dashboard/subscriptions");
}

async function updatePlanStatus(formData: FormData) {
  "use server";

  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const idValue = formData.get("planId");
  const activeValue = formData.get("isActive");

  if (
    typeof idValue !== "string" ||
    !/^\d+$/.test(idValue) ||
    (activeValue !== "true" && activeValue !== "false")
  ) {
    throw new Error("Invalid subscription plan update.");
  }

  const id = Number(idValue);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Invalid subscription plan ID.");
  }

  const plan = await db.orm.public.SubscriptionPlan.where((item) =>
    item.id.eq(id),
  ).first();

  if (!plan) {
    throw new Error("Subscription plan not found.");
  }

  await db.orm.public.SubscriptionPlan.where((item) => item.id.eq(id)).update({
    isActive: activeValue === "true",
  });

  redirect("/dashboard/subscriptions");
}

function formatPrice(price: unknown, currency: string) {
  const amount = Number(price);

  if (!Number.isFinite(amount)) return `${currency} ${String(price)}`;

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatInterval(interval: string) {
  switch (interval) {
    case "MONTHLY":
      return "Monthly";
    case "QUARTERLY":
      return "Quarterly";
    case "YEARLY":
      return "Yearly";
    default:
      return interval;
  }
}

function formatLimit(value: number | null) {
  return value === null ? "Unlimited" : value.toLocaleString("en-NG");
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value.toLocaleString("en-NG")}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export default async function SubscriptionsPage() {
  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const plans = await db.orm.public.SubscriptionPlan.all();

  const activeCount = plans.filter((plan) => plan.isActive).length;
  const inactiveCount = plans.length - activeCount;

  const orderedPlans = [...plans].sort(
    (a, b) =>
      Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 transition hover:text-slate-900"
        >
          ← Platform Dashboard
        </Link>

        <div className="mt-3">
          <p className="text-sm font-medium text-slate-500">
            Platform Administration
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Subscriptions & Plans
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Define the subscription packages, pricing, and usage limits
            available to schools on your platform.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Total Plans"
          value={plans.length}
          detail="All plans created on the platform"
        />
        <SummaryCard
          label="Active Plans"
          value={activeCount}
          detail="Available for new assignments"
        />
        <SummaryCard
          label="Inactive Plans"
          value={inactiveCount}
          detail="Not available for new assignments"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Create Subscription Plan
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Leave a usage limit blank to allow unlimited usage for that
            resource.
          </p>
        </div>

        <form action={createSubscriptionPlan} className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="name" className={labelClass}>
                Plan name *
              </label>
              <input
                id="name"
                name="name"
                required
                maxLength={100}
                placeholder="e.g. Starter, Professional, Enterprise"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="price" className={labelClass}>
                Price per billing period (NGN) *
              </label>
              <input
                id="price"
                name="price"
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="e.g. 25000"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="billingInterval" className={labelClass}>
                Billing interval *
              </label>
              <select
                id="billingInterval"
                name="billingInterval"
                required
                defaultValue="MONTHLY"
                className={inputClass}
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className={labelClass}>
                Description
              </label>
              <input
                id="description"
                name="description"
                maxLength={1000}
                placeholder="A short summary of this package"
                className={inputClass}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="font-semibold text-slate-900">Usage limits</h3>
            <p className="mt-1 text-sm text-slate-500">
              Set the maximum resources included in this plan.
            </p>

            <div className="mt-4 grid gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="maxStudents" className={labelClass}>
                  Maximum students
                </label>
                <input
                  id="maxStudents"
                  name="maxStudents"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Unlimited"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="maxTeachers" className={labelClass}>
                  Maximum teachers
                </label>
                <input
                  id="maxTeachers"
                  name="maxTeachers"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Unlimited"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="maxStorageMb" className={labelClass}>
                  Storage limit (MB)
                </label>
                <input
                  id="maxStorageMb"
                  name="maxStorageMb"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Unlimited"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <label htmlFor="features" className={labelClass}>
              Included features
            </label>
            <textarea
              id="features"
              name="features"
              rows={5}
              maxLength={5000}
              placeholder={
                "Student management\nAttendance and results\nParent portal\nReport card generation"
              }
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Enter one feature per line. Duplicate and blank lines will be
              removed.
            </p>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              className="rounded-xl bg-[#071d3a] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102f55]"
            >
              Create Plan
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Subscription Plan Directory
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {plans.length} {plans.length === 1 ? "plan" : "plans"} configured
          </p>
        </div>

        {orderedPlans.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-500">
              +
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              No subscription plans yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Create your first plan using the form above.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
            {orderedPlans.map((plan) => (
              <article
                key={plan.id}
                className="flex flex-col rounded-xl border border-slate-200 p-5 transition hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-900">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {plan.description || "No description provided."}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      plan.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {plan.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-5 border-b border-slate-100 pb-5">
                  <p className="text-3xl font-bold tracking-tight text-slate-900">
                    {formatPrice(plan.price, plan.currency)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    per {formatInterval(plan.billingInterval).toLowerCase()}{" "}
                    billing period
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Students</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatLimit(plan.maxStudents)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Teachers</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatLimit(plan.maxTeachers)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Storage</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {plan.maxStorageMb === null
                        ? "Unlimited"
                        : `${plan.maxStorageMb.toLocaleString("en-NG")} MB`}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex-1">
                  <h4 className="text-sm font-semibold text-slate-800">
                    Included features
                  </h4>

                  {plan.features.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">
                      No features listed.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {plan.features.map((feature, index) => (
                        <li
                          key={`${plan.id}-${index}`}
                          className="flex items-start gap-2 text-sm text-slate-600"
                        >
                          <span className="mt-0.5 font-bold text-emerald-600">
                            ✓
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">
                    Plan ID: {plan.id}
                  </span>

                  <form action={updatePlanStatus}>
                    <input type="hidden" name="planId" value={plan.id} />
                    <input
                      type="hidden"
                      name="isActive"
                      value={plan.isActive ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                        plan.isActive
                          ? "border-amber-200 text-amber-800 hover:bg-amber-50"
                          : "border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                      }`}
                    >
                      {plan.isActive ? "Deactivate Plan" : "Activate Plan"}
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
