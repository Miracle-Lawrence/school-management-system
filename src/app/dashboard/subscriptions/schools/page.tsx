import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";

const subscriptionStatuses = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "SUSPENDED",
  "CANCELLED",
  "EXPIRED",
] as const;

type SubscriptionStatus = (typeof subscriptionStatuses)[number];

async function createSchoolSubscription(formData: FormData) {
  "use server";

  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const schoolId = Number(formData.get("schoolId"));
  const planId = Number(formData.get("planId"));
  const status = String(formData.get("status")) as SubscriptionStatus;
  const trialEndsAtInput = String(formData.get("trialEndsAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!Number.isInteger(schoolId) || schoolId <= 0) {
    throw new Error("Select a valid school.");
  }

  if (!Number.isInteger(planId) || planId <= 0) {
    throw new Error("Select a valid subscription plan.");
  }

  if (!subscriptionStatuses.includes(status)) {
    throw new Error("Select a valid subscription status.");
  }

  if (trialEndsAtInput && Number.isNaN(Date.parse(trialEndsAtInput))) {
    throw new Error("Enter a valid trial end date.");
  }

  if (notes.length > 2000) {
    throw new Error("Notes cannot exceed 2,000 characters.");
  }

  const school = await db.orm.public.School.where((item) =>
    item.id.eq(schoolId),
  ).first();

  if (!school) {
    throw new Error("The selected school was not found.");
  }

  const plan = await db.orm.public.SubscriptionPlan.where((item) =>
    item.id.eq(planId),
  ).first();

  if (!plan || !plan.isActive) {
    throw new Error("Select an existing active subscription plan.");
  }

  const existingSubscriptions = await db.orm.public.SchoolSubscription.where(
    (item) => item.schoolId.eq(schoolId),
  ).all();

  const ongoingStatuses: SubscriptionStatus[] = [
    "TRIALING",
    "ACTIVE",
    "PAST_DUE",
  ];

  const hasOngoingSubscription = existingSubscriptions.some((subscription) =>
    ongoingStatuses.includes(subscription.status as SubscriptionStatus),
  );

  if (hasOngoingSubscription) {
    throw new Error(
      "This school already has an ongoing subscription. Update its existing subscription instead.",
    );
  }

  await db.orm.public.SchoolSubscription.create({
    schoolId,
    planId,
    status,
    startsAt: new Date().toISOString(),
    trialEndsAt: trialEndsAtInput
      ? new Date(`${trialEndsAtInput}T23:59:59.000Z`).toISOString()
      : null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelledAt: null,
    notes: notes || null,
  });

  redirect("/dashboard/subscriptions/schools");
}

async function updateSubscriptionStatus(formData: FormData) {
  "use server";

  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const subscriptionId = Number(formData.get("subscriptionId"));
  const status = String(formData.get("status")) as SubscriptionStatus;

  if (!Number.isInteger(subscriptionId) || subscriptionId <= 0) {
    throw new Error("Invalid subscription.");
  }

  if (!subscriptionStatuses.includes(status)) {
    throw new Error("Invalid subscription status.");
  }

  const subscription = await db.orm.public.SchoolSubscription.where((item) =>
    item.id.eq(subscriptionId),
  ).first();

  if (!subscription) {
    throw new Error("Subscription not found.");
  }

  const ongoingStatuses: SubscriptionStatus[] = [
    "TRIALING",
    "ACTIVE",
    "PAST_DUE",
  ];

  if (ongoingStatuses.includes(status)) {
    const otherSubscriptions = await db.orm.public.SchoolSubscription.where(
      (item) => item.schoolId.eq(subscription.schoolId),
    ).all();

    const conflict = otherSubscriptions.some(
      (item) =>
        item.id !== subscriptionId &&
        ongoingStatuses.includes(item.status as SubscriptionStatus),
    );

    if (conflict) {
      throw new Error("This school already has another ongoing subscription.");
    }
  }

  await db.orm.public.SchoolSubscription.where((item) =>
    item.id.eq(subscriptionId),
  ).update({
    status,
    cancelledAt:
      status === "CANCELLED"
        ? new Date().toISOString()
        : subscription.cancelledAt,
  });

  redirect("/dashboard/subscriptions/schools");
}

function formatDate(value: unknown) {
  if (!value) return "—";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value: unknown, currency: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return String(value);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function SchoolSubscriptionsPage() {
  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const [schools, plans, subscriptions] = await Promise.all([
    db.orm.public.School.all(),
    db.orm.public.SubscriptionPlan.all(),
    db.orm.public.SchoolSubscription.all(),
  ]);

  const schoolMap = new Map(schools.map((school) => [school.id, school]));
  const planMap = new Map(plans.map((plan) => [plan.id, plan]));

  const sortedSubscriptions = [...subscriptions].sort((a, b) => b.id - a.id);

  const activeCount = subscriptions.filter(
    (item) => item.status === "ACTIVE",
  ).length;

  const trialingCount = subscriptions.filter(
    (item) => item.status === "TRIALING",
  ).length;

  const attentionCount = subscriptions.filter(
    (item) => item.status === "PAST_DUE" || item.status === "SUSPENDED",
  ).length;

  const ongoingStatuses: SubscriptionStatus[] = [
    "TRIALING",
    "ACTIVE",
    "PAST_DUE",
  ];

  const availableSchools = schools.filter((school) => {
    return !subscriptions.some(
      (subscription) =>
        subscription.schoolId === school.id &&
        ongoingStatuses.includes(subscription.status as SubscriptionStatus),
    );
  });

  const activePlans = plans.filter((plan) => plan.isActive);

  return (
    <main className="space-y-8 p-6 text-slate-900 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/subscriptions"
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            ← Subscription Plans
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            School Subscriptions
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Assign plans to schools and manage their subscription status.
          </p>
        </div>

        <Link
          href="/dashboard/schools"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          View Schools
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total subscriptions", value: subscriptions.length },
          { label: "Active", value: activeCount },
          { label: "Trialing", value: trialingCount },
          { label: "Needs attention", value: attentionCount },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-bold">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Assign a subscription</h2>

        <p className="mt-1 text-sm text-slate-600">
          Assign an active plan to a school without an ongoing subscription.
        </p>

        {availableSchools.length === 0 || activePlans.length === 0 ? (
          <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            {availableSchools.length === 0
              ? "All schools already have ongoing subscriptions, or no schools are registered."
              : "There are no active plans available. Activate or create a plan first."}
          </p>
        ) : (
          <form action={createSchoolSubscription} className="mt-5 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-medium">
                School
                <select
                  name="schoolId"
                  required
                  defaultValue=""
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
                >
                  <option value="" disabled>
                    Select a school
                  </option>
                  {availableSchools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Subscription plan
                <select
                  name="planId"
                  required
                  defaultValue=""
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
                >
                  <option value="" disabled>
                    Select a plan
                  </option>
                  {activePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — {formatMoney(plan.price, plan.currency)} /{" "}
                      {plan.billingInterval.toLowerCase()}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Initial status
                <select
                  name="status"
                  required
                  defaultValue="TRIALING"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
                >
                  {(["TRIALING", "ACTIVE"] as const).map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Trial end date
                <input
                  type="date"
                  name="trialEndsAt"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Optional. Usually relevant for trial subscriptions.
                </span>
              </label>
            </div>

            <label className="block text-sm font-medium">
              Internal notes
              <textarea
                name="notes"
                rows={3}
                maxLength={2000}
                placeholder="Optional notes about this subscription..."
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Assign Subscription
            </button>
          </form>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-bold">Subscription directory</h2>
          <p className="mt-1 text-sm text-slate-600">
            Review each school&apos;s plan, billing period, and current status.
          </p>
        </div>

        {sortedSubscriptions.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="font-semibold">No subscriptions yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              Assign a plan to a school using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">School</th>
                  <th className="px-5 py-4">Plan</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Trial ends</th>
                  <th className="px-5 py-4">Period ends</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sortedSubscriptions.map((subscription) => {
                  const school = schoolMap.get(subscription.schoolId);
                  const plan = planMap.get(subscription.planId);

                  return (
                    <tr key={subscription.id} className="align-top">
                      <td className="px-5 py-4">
                        <p className="font-semibold">
                          {school?.name ?? `School #${subscription.schoolId}`}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Subscription #{subscription.id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {plan?.name ?? `Plan #${subscription.planId}`}
                      </td>

                      <td className="px-5 py-4">
                        {plan
                          ? `${formatMoney(plan.price, plan.currency)} / ${plan.billingInterval.toLowerCase()}`
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                          {statusLabel(subscription.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {formatDate(subscription.trialEndsAt)}
                      </td>

                      <td className="px-5 py-4">
                        {formatDate(subscription.currentPeriodEnd)}
                      </td>

                      <td className="px-5 py-4">
                        <form
                          action={updateSubscriptionStatus}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="hidden"
                            name="subscriptionId"
                            value={subscription.id}
                          />

                          <select
                            name="status"
                            defaultValue={subscription.status}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs"
                            aria-label={`Status for subscription ${subscription.id}`}
                          >
                            {subscriptionStatuses.map((status) => (
                              <option key={status} value={status}>
                                {statusLabel(status)}
                              </option>
                            ))}
                          </select>

                          <button
                            type="submit"
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                          >
                            Save
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
