import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";

const paymentStatuses = [
  "PENDING",
  "SUCCESSFUL",
  "FAILED",
  "REFUNDED",
] as const;

type PaymentStatus = (typeof paymentStatuses)[number];

async function createPaymentRecord(formData: FormData) {
  "use server";

  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const subscriptionId = Number(formData.get("subscriptionId"));
  const amountInput = String(formData.get("amount") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();
  const provider = String(formData.get("provider") ?? "").trim();
  const status = String(formData.get("status")) as PaymentStatus;
  const paidAtInput = String(formData.get("paidAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const amount = Number(amountInput);

  if (!Number.isInteger(subscriptionId) || subscriptionId <= 0) {
    throw new Error("Select a valid subscription.");
  }

  if (
    !amountInput ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !/^\d+(\.\d{1,2})?$/.test(amountInput)
  ) {
    throw new Error("Enter a valid positive amount with up to two decimals.");
  }

  if (!reference || reference.length > 200) {
    throw new Error("Enter a payment reference of up to 200 characters.");
  }

  if (provider.length > 100) {
    throw new Error("Payment provider cannot exceed 100 characters.");
  }

  if (!paymentStatuses.includes(status)) {
    throw new Error("Select a valid payment status.");
  }

  if (paidAtInput && Number.isNaN(Date.parse(paidAtInput))) {
    throw new Error("Enter a valid payment date.");
  }

  if (notes.length > 2000) {
    throw new Error("Notes cannot exceed 2,000 characters.");
  }

  const subscription = await db.orm.public.SchoolSubscription.where((item) =>
    item.id.eq(subscriptionId),
  ).first();

  if (!subscription) {
    throw new Error("The selected subscription was not found.");
  }

  const plan = await db.orm.public.SubscriptionPlan.where((item) =>
    item.id.eq(subscription.planId),
  ).first();

  if (!plan) {
    throw new Error("The subscription plan could not be found.");
  }

  const existingPayments = await db.orm.public.SubscriptionPayment.where(
    (item) => item.reference.eq(reference),
  ).all();

  if (existingPayments.length > 0) {
    throw new Error("This payment reference already exists.");
  }

  await db.orm.public.SubscriptionPayment.create({
    subscriptionId,
    amount: amount.toFixed(2),
    currency: plan.currency,
    status,
    reference,
    provider: provider || null,
    paidAt:
      status === "SUCCESSFUL"
        ? paidAtInput
          ? new Date(paidAtInput).toISOString()
          : new Date().toISOString()
        : null,
    notes: notes || null,
  });

  redirect("/dashboard/subscriptions/payments");
}

async function updatePaymentStatus(formData: FormData) {
  "use server";

  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const paymentId = Number(formData.get("paymentId"));
  const status = String(formData.get("status")) as PaymentStatus;

  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    throw new Error("Invalid payment record.");
  }

  if (!paymentStatuses.includes(status)) {
    throw new Error("Invalid payment status.");
  }

  const payment = await db.orm.public.SubscriptionPayment.where((item) =>
    item.id.eq(paymentId),
  ).first();

  if (!payment) {
    throw new Error("Payment record not found.");
  }

  if (payment.status === "REFUNDED" && status !== "REFUNDED") {
    throw new Error("A refunded payment cannot be changed back.");
  }

  if (payment.status === "SUCCESSFUL" && status === "PENDING") {
    throw new Error("A successful payment cannot be changed back to pending.");
  }

  await db.orm.public.SubscriptionPayment.where((item) =>
    item.id.eq(paymentId),
  ).update({
    status,
    paidAt:
      status === "SUCCESSFUL"
        ? (payment.paidAt ?? new Date().toISOString())
        : payment.paidAt,
  });

  redirect("/dashboard/subscriptions/payments");
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

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function SubscriptionPaymentsPage() {
  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const [schools, plans, subscriptions, payments] = await Promise.all([
    db.orm.public.School.all(),
    db.orm.public.SubscriptionPlan.all(),
    db.orm.public.SchoolSubscription.all(),
    db.orm.public.SubscriptionPayment.all(),
  ]);

  const schoolMap = new Map(schools.map((school) => [school.id, school]));
  const planMap = new Map(plans.map((plan) => [plan.id, plan]));
  const subscriptionMap = new Map(
    subscriptions.map((subscription) => [subscription.id, subscription]),
  );

  const sortedPayments = [...payments].sort((a, b) => b.id - a.id);

  const successfulPayments = payments.filter(
    (payment) => payment.status === "SUCCESSFUL",
  );

  const pendingCount = payments.filter(
    (payment) => payment.status === "PENDING",
  ).length;

  const successfulRevenue = successfulPayments.reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  );

  const availableSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.status !== "CANCELLED" && subscription.status !== "EXPIRED",
  );

  return (
    <main className="space-y-8 p-6 text-slate-900 md:p-8">
      <header>
        <Link
          href="/dashboard/subscriptions"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          ← Subscription Plans
        </Link>

        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Payment Records
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Record and review payments associated with school subscriptions.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total payment records</p>
          <p className="mt-3 text-3xl font-bold">{payments.length}</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Successful payments</p>
          <p className="mt-3 text-3xl font-bold">{successfulPayments.length}</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending payments</p>
          <p className="mt-3 text-3xl font-bold">{pendingCount}</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Successful recorded revenue</p>
          <p className="mt-3 text-2xl font-bold">
            {formatMoney(successfulRevenue, "NGN")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            NGN total; excludes other currencies.
          </p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Record a payment</h2>

        <p className="mt-1 text-sm text-slate-600">
          Use this form for administrative records. A successful status entered
          manually is not proof that a gateway payment has been verified.
        </p>

        {availableSubscriptions.length === 0 ? (
          <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            No eligible subscriptions are available. Create a school
            subscription first.
          </p>
        ) : (
          <form action={createPaymentRecord} className="mt-5 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-medium">
                School subscription
                <select
                  name="subscriptionId"
                  required
                  defaultValue=""
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
                >
                  <option value="" disabled>
                    Select a subscription
                  </option>

                  {availableSubscriptions.map((subscription) => {
                    const school = schoolMap.get(subscription.schoolId);
                    const plan = planMap.get(subscription.planId);

                    return (
                      <option key={subscription.id} value={subscription.id}>
                        {school?.name ?? `School #${subscription.schoolId}`} —{" "}
                        {plan?.name ?? `Plan #${subscription.planId}`} — #
                        {subscription.id}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Amount
                <input
                  type="number"
                  name="amount"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="15000.00"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </label>

              <label className="block text-sm font-medium">
                Payment reference
                <input
                  type="text"
                  name="reference"
                  required
                  maxLength={200}
                  placeholder="e.g. INV-2026-001"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </label>

              <label className="block text-sm font-medium">
                Payment provider
                <input
                  type="text"
                  name="provider"
                  maxLength={100}
                  placeholder="e.g. Bank transfer or Paystack"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </label>

              <label className="block text-sm font-medium">
                Status
                <select
                  name="status"
                  required
                  defaultValue="PENDING"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
                >
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Payment date
                <input
                  type="date"
                  name="paidAt"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Used when recording a successful payment.
                </span>
              </label>
            </div>

            <label className="block text-sm font-medium">
              Internal notes
              <textarea
                name="notes"
                rows={3}
                maxLength={2000}
                placeholder="Optional payment notes..."
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Save Payment Record
            </button>
          </form>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-bold">Payment history</h2>
          <p className="mt-1 text-sm text-slate-600">
            Review payment references, school subscriptions, amounts, and
            statuses.
          </p>
        </div>

        {sortedPayments.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="font-semibold">No payment records yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              Records will appear here when you save your first payment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Reference</th>
                  <th className="px-5 py-4">School</th>
                  <th className="px-5 py-4">Plan</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Provider</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Paid at</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sortedPayments.map((payment) => {
                  const subscription = subscriptionMap.get(
                    payment.subscriptionId,
                  );

                  const school = subscription
                    ? schoolMap.get(subscription.schoolId)
                    : undefined;

                  const plan = subscription
                    ? planMap.get(subscription.planId)
                    : undefined;

                  return (
                    <tr key={payment.id} className="align-top">
                      <td className="px-5 py-4">
                        <p className="font-semibold">{payment.reference}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Payment #{payment.id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {school?.name ?? "Unknown school"}
                      </td>

                      <td className="px-5 py-4">
                        {plan?.name ?? "Unknown plan"}
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {formatMoney(payment.amount, payment.currency)}
                      </td>

                      <td className="px-5 py-4">{payment.provider || "—"}</td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                          {statusLabel(payment.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {formatDate(payment.paidAt)}
                      </td>

                      <td className="px-5 py-4">
                        <form
                          action={updatePaymentStatus}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="hidden"
                            name="paymentId"
                            value={payment.id}
                          />

                          <select
                            name="status"
                            defaultValue={payment.status}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs"
                            aria-label={`Status for payment ${payment.id}`}
                          >
                            {paymentStatuses.map((status) => (
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
