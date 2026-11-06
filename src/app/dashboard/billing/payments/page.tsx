import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import {
  getPlatformBillingOverview,
  getSchoolPlatformInvoices,
  recordPlatformPayment,
} from "@/lib/services/platform-billing.service";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

function formatCurrency(value: unknown, currency = "NGN") {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusStyle(status: string) {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700";
    case "PARTIALLY_PAID":
      return "bg-blue-50 text-blue-700";
    case "OVERDUE":
      return "bg-red-50 text-red-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

async function recordPayment(formData: FormData) {
  "use server";

  const session = await requireRole([
    "PLATFORM_OWNER",
    "PLATFORM_ADMIN",
  ]);

  const schoolIdValue = formData.get("schoolId");
  const invoiceIdValue = formData.get("invoiceId");
  const amountValue = formData.get("amount");
  const methodValue = formData.get("method");
  const referenceValue = formData.get("paymentReference");
  const notesValue = formData.get("notes");

  if (
    typeof schoolIdValue !== "string" ||
    typeof invoiceIdValue !== "string" ||
    typeof amountValue !== "string" ||
    !/^\d+$/.test(schoolIdValue) ||
    !/^\d+$/.test(invoiceIdValue)
  ) {
    throw new Error("Invalid payment details.");
  }

  const schoolId = Number(schoolIdValue);
  const invoiceId = Number(invoiceIdValue);
  const amount = Number(amountValue);
  const recordedById = Number(session.user.id);

  if (
    !Number.isSafeInteger(schoolId) ||
    schoolId <= 0 ||
    !Number.isSafeInteger(invoiceId) ||
    invoiceId <= 0 ||
    !Number.isSafeInteger(recordedById) ||
    recordedById <= 0 ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error("Invalid payment details.");
  }

  if (
    methodValue !== "BANK_TRANSFER" &&
    methodValue !== "CASH"
  ) {
    throw new Error("Select a valid payment method.");
  }

  const paymentReference =
    typeof referenceValue === "string"
      ? referenceValue.trim()
      : "";

  const notes =
    typeof notesValue === "string" ? notesValue.trim() : "";

  if (paymentReference.length > 150) {
    throw new Error("Payment reference must not exceed 150 characters.");
  }

  if (notes.length > 1000) {
    throw new Error("Payment notes must not exceed 1000 characters.");
  }

  const invoices = await getSchoolPlatformInvoices(schoolId);
  const selectedInvoice = invoices.find(
    (invoice) => invoice.id === invoiceId,
  );

  if (!selectedInvoice) {
    throw new Error("The selected invoice does not belong to this school.");
  }

  await recordPlatformPayment({
    invoiceId,
    amount,
    method: methodValue,
    recordedById,
    paymentReference: paymentReference || null,
    notes: notes || null,
  });

  redirect(
    `/dashboard/billing/payments?schoolId=${schoolId}&invoiceId=${invoiceId}&recorded=1`,
  );
}

export default async function PlatformPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    schoolId?: string;
    invoiceId?: string;
    recorded?: string;
  }>;
}) {
  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const [overview, params] = await Promise.all([
    getPlatformBillingOverview(),
    searchParams,
  ]);

  const selectedSchoolId =
    params.schoolId && /^\d+$/.test(params.schoolId)
      ? Number(params.schoolId)
      : null;

  const selectedInvoiceId =
    params.invoiceId && /^\d+$/.test(params.invoiceId)
      ? Number(params.invoiceId)
      : null;

  const selectedSchool = overview.schools.find(
    (school) => school.id === selectedSchoolId,
  );

  const invoices = selectedSchool
    ? await getSchoolPlatformInvoices(selectedSchool.id)
    : [];

  const selectedInvoice = invoices.find(
    (invoice) => invoice.id === selectedInvoiceId,
  );

  const canReceivePayment =
    selectedInvoice &&
    ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(
      selectedInvoice.status,
    ) &&
    Number(selectedInvoice.outstandingBalance) > 0;

  const totalPayments = invoices.reduce(
    (total, invoice) =>
      total +
      invoice.payments.filter(
        (payment) => payment.status === "CONFIRMED",
      ).length,
    0,
  );

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
            Record Payments
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Record school subscription invoice payments, monitor outstanding
            balances, and access payment receipts.
          </p>
        </div>
      </div>

      {params.recorded === "1" && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          Payment recorded and confirmed successfully.
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Select Invoice
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose a school and then select the invoice you want to manage.
          </p>
        </div>

        <form method="GET" className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="schoolId" className={labelClass}>
              Select School
            </label>
            <select
              id="schoolId"
              name="schoolId"
              defaultValue={selectedSchoolId?.toString() ?? ""}
              required
              className={inputClass}
            >
              <option value="">Choose a school</option>
              {overview.schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-[#071d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#102f55]"
            >
              Load School Invoices
            </button>
          </div>
        </form>

        {selectedSchool && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {selectedSchool.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {invoices.length} invoice(s) · {totalPayments} confirmed payment(s)
                </p>
              </div>
              <Link
                href={`/dashboard/billing/invoices?schoolId=${selectedSchool.id}`}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                View invoices →
              </Link>
            </div>

            {invoices.length === 0 ? (
              <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                This school has no platform invoices yet. Generate an invoice
                before recording a payment.
              </p>
            ) : (
              <form method="GET" className="grid gap-4 sm:grid-cols-2">
                <input
                  type="hidden"
                  name="schoolId"
                  value={selectedSchool.id}
                />

                <div>
                  <label htmlFor="invoiceId" className={labelClass}>
                    Select Invoice
                  </label>
                  <select
                    id="invoiceId"
                    name="invoiceId"
                    defaultValue={selectedInvoiceId?.toString() ?? ""}
                    required
                    className={inputClass}
                  >
                    <option value="">Choose an invoice</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoiceNumber} — {invoice.sessionName} /{" "}
                        {invoice.termName} ({invoice.status.replace(/_/g, " ")})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Load Invoice
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </section>

      {selectedInvoice && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Selected Invoice</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedInvoice.invoiceNumber}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedInvoice.sessionName} · {selectedInvoice.termName}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle(selectedInvoice.status)}`}
              >
                {selectedInvoice.status.replace(/_/g, " ")}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Invoice Total
                </p>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs font-medium text-emerald-700">
                  Amount Paid
                </p>
                <p className="mt-2 text-xl font-bold text-emerald-800">
                  {formatCurrency(selectedInvoice.amountPaid, selectedInvoice.currency)}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-xs font-medium text-amber-700">
                  Outstanding Balance
                </p>
                <p className="mt-2 text-xl font-bold text-amber-800">
                  {formatCurrency(selectedInvoice.outstandingBalance, selectedInvoice.currency)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p>
                Student count:{" "}
                <strong className="text-slate-900">
                  {selectedInvoice.studentCount}
                </strong>
              </p>
              <p>
                Due date:{" "}
                <strong className="text-slate-900">
                  {formatDate(selectedInvoice.dueDate)}
                </strong>
              </p>
            </div>
          </section>

          {canReceivePayment && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Record New Payment
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the amount received. The system will prevent payments
                  above the outstanding balance.
                </p>
              </div>

              <form action={recordPayment} className="space-y-5">
                <input
                  type="hidden"
                  name="schoolId"
                  value={selectedSchool!.id}
                />
                <input
                  type="hidden"
                  name="invoiceId"
                  value={selectedInvoice.id}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="amount" className={labelClass}>
                      Amount Received (NGN)
                    </label>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      min="0.01"
                      max={selectedInvoice.outstandingBalance}
                      step="0.01"
                      required
                      className={inputClass}
                      placeholder="e.g. 50000"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Maximum: {formatCurrency(selectedInvoice.outstandingBalance)}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="method" className={labelClass}>
                      Payment Method
                    </label>
                    <select
                      id="method"
                      name="method"
                      required
                      defaultValue="BANK_TRANSFER"
                      className={inputClass}
                    >
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="paymentReference" className={labelClass}>
                    Payment Reference (Optional)
                  </label>
                  <input
                    id="paymentReference"
                    name="paymentReference"
                    type="text"
                    maxLength={150}
                    className={inputClass}
                    placeholder="Bank transaction reference or other identifier"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className={labelClass}>
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    maxLength={1000}
                    className={inputClass}
                    placeholder="Additional payment information..."
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Record and Confirm Payment
                </button>
              </form>
            </section>
          )}

          {!canReceivePayment && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              This invoice has no outstanding balance or is not available
              for payment.
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Payment History
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Recorded payments for {selectedInvoice.invoiceNumber}.
              </p>
            </div>

            {selectedInvoice.payments.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                No payments have been recorded for this invoice.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 font-semibold text-slate-600">Receipt</th>
                      <th className="px-5 py-4 font-semibold text-slate-600">Date</th>
                      <th className="px-5 py-4 font-semibold text-slate-600">Method</th>
                      <th className="px-5 py-4 font-semibold text-slate-600">Reference</th>
                      <th className="px-5 py-4 font-semibold text-slate-600">Amount</th>
                      <th className="px-5 py-4 font-semibold text-slate-600">Status</th>
                      <th className="px-5 py-4 font-semibold text-slate-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {payment.receiptNumber ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(payment.paidAt ?? payment.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {payment.method.replace(/_/g, " ")}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {payment.paymentReference ?? "—"}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {formatCurrency(payment.amount, selectedInvoice.currency)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              payment.status === "CONFIRMED"
                                ? "bg-emerald-50 text-emerald-700"
                                : payment.status === "REJECTED"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {payment.status === "CONFIRMED" && payment.receiptNumber ? (
                            <Link
                              href={`/dashboard/billing/payments/${payment.id}/receipt`}
                              className="font-semibold text-blue-600 hover:text-blue-800"
                            >
                              View Receipt →
                            </Link>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

