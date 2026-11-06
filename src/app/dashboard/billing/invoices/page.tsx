import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import {
  createPlatformInvoice,
  getPlatformBillingOverview,
  getSchoolPlatformInvoices,
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
    case "VOID":
      return "bg-slate-100 text-slate-500";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

async function generateInvoice(formData: FormData) {
  "use server";

  const session = await requireRole([
    "PLATFORM_OWNER",
    "PLATFORM_ADMIN",
  ]);

  const schoolIdValue = formData.get("schoolId");
  const academicSessionIdValue = formData.get("academicSessionId");
  const termIdValue = formData.get("termId");
  const dueDateValue = formData.get("dueDate");
  const notesValue = formData.get("notes");

  if (
    typeof schoolIdValue !== "string" ||
    typeof academicSessionIdValue !== "string" ||
    typeof termIdValue !== "string" ||
    !/^\d+$/.test(schoolIdValue) ||
    !/^\d+$/.test(academicSessionIdValue) ||
    !/^\d+$/.test(termIdValue)
  ) {
    throw new Error("Invalid invoice selection.");
  }

  const schoolId = Number(schoolIdValue);
  const academicSessionId = Number(academicSessionIdValue);
  const termId = Number(termIdValue);

  if (
    !Number.isSafeInteger(schoolId) ||
    schoolId <= 0 ||
    !Number.isSafeInteger(academicSessionId) ||
    academicSessionId <= 0 ||
    !Number.isSafeInteger(termId) ||
    termId <= 0
  ) {
    throw new Error("Invalid invoice selection.");
  }

  const createdById = Number(session.user.id);

  if (!Number.isSafeInteger(createdById) || createdById <= 0) {
    throw new Error("Unable to identify the platform user.");
  }

  const dueDate =
    typeof dueDateValue === "string" && dueDateValue.trim()
      ? dueDateValue.trim()
      : null;

  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    throw new Error("Invalid invoice due date.");
  }

  const notes =
    typeof notesValue === "string" ? notesValue.trim() : "";

  if (notes.length > 1000) {
    throw new Error("Invoice notes must not exceed 1000 characters.");
  }

  await createPlatformInvoice({
    schoolId,
    academicSessionId,
    termId,
    createdById,
    dueDate,
    notes: notes || null,
  });

  redirect(
    `/dashboard/billing/invoices?schoolId=${schoolId}&created=1`,
  );
}

export default async function PlatformInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    schoolId?: string;
    sessionId?: string;
    created?: string;
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

  const selectedSessionId =
    params.sessionId && /^\d+$/.test(params.sessionId)
      ? Number(params.sessionId)
      : null;

  const selectedSchool = overview.schools.find(
    (school) => school.id === selectedSchoolId,
  );

  const sessions = selectedSchool
    ? await db.orm.public.AcademicSession.where({
        schoolId: selectedSchool.id,
      }).all()
    : [];

  const selectedSession = sessions.find(
    (item) => item.id === selectedSessionId,
  );

  const terms = selectedSession
    ? await db.orm.public.Term.where({
        sessionId: selectedSession.id,
      }).all()
    : [];

  const [invoices, rates] = await Promise.all([
    selectedSchool
      ? getSchoolPlatformInvoices(selectedSchool.id)
      : Promise.resolve([]),
    Promise.resolve(overview.rates),
  ]);

  const activeRate = rates.find(
    (rate) =>
      rate.schoolId === selectedSchool?.id && rate.isActive,
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
            School Invoices
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Generate termly platform invoices for schools and monitor
            their payment status.
          </p>
        </div>
      </div>

      {params.created === "1" && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          Invoice generated successfully.
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Generate New Invoice
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select the school and academic period you want to invoice.
          </p>
        </div>

        <form method="GET" className="mb-6 grid gap-4 sm:grid-cols-2">
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
              Load School Sessions
            </button>
          </div>
        </form>

        {selectedSchool && (
          <div className="mb-6 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">
              {selectedSchool.name}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              School ID: {selectedSchool.id}
            </p>

            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span className="text-slate-600">
                Billing rate:{" "}
                <strong className="text-slate-900">
                  {activeRate
                    ? formatCurrency(activeRate.ratePerStudent)
                    : "Not configured"}
                </strong>
              </span>
              <Link
                href="/dashboard/billing/rates"
                className="font-semibold text-blue-600 hover:text-blue-800"
              >
                Manage rates →
              </Link>
            </div>
          </div>
        )}

        {selectedSchool && (
          <form method="GET" className="mb-6 grid gap-4 sm:grid-cols-2">
            <input
              type="hidden"
              name="schoolId"
              value={selectedSchool.id}
            />

            <div>
              <label htmlFor="sessionId" className={labelClass}>
                Academic Session
              </label>
              <select
                id="sessionId"
                name="sessionId"
                defaultValue={selectedSessionId?.toString() ?? ""}
                required
                className={inputClass}
              >
                <option value="">Choose an academic session</option>
                {sessions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.isActive ? " (Active)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Load Terms
              </button>
            </div>
          </form>
        )}

        {selectedSchool && sessions.length === 0 && (
          <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            This school has no academic sessions. Create an academic
            session in the school's portal before generating an invoice.
          </p>
        )}

        {selectedSession && (
          <form action={generateInvoice} className="space-y-5 border-t border-slate-200 pt-6">
            <input
              type="hidden"
              name="schoolId"
              value={selectedSchool!.id}
            />
            <input
              type="hidden"
              name="academicSessionId"
              value={selectedSession.id}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="termId" className={labelClass}>
                  Academic Term
                </label>
                <select
                  id="termId"
                  name="termId"
                  required
                  className={inputClass}
                  defaultValue=""
                >
                  <option value="">Choose a term</option>
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name}
                      {term.isActive ? " (Active)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dueDate" className={labelClass}>
                  Invoice Due Date (Optional)
                </label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className={labelClass}>
                Invoice Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                maxLength={1000}
                className={inputClass}
                placeholder="Additional information for this invoice..."
              />
            </div>

            {terms.length === 0 ? (
              <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                No terms have been created for this academic session.
              </p>
            ) : (
              <button
                type="submit"
                disabled={!activeRate}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Generate School Invoice
              </button>
            )}

            {!activeRate && (
              <p className="text-sm text-red-600">
                An active billing rate is required before generating an invoice.
              </p>
            )}
          </form>
        )}
      </section>

      {selectedSchool && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Invoice History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Invoices generated for {selectedSchool.name}.
            </p>
          </div>

          {invoices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <h3 className="font-semibold text-slate-900">
                No invoices yet
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Generate the first invoice for this school using the form above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 font-semibold text-slate-600">Invoice</th>
                    <th className="px-5 py-4 font-semibold text-slate-600">Academic Period</th>
                    <th className="px-5 py-4 font-semibold text-slate-600">Students</th>
                    <th className="px-5 py-4 font-semibold text-slate-600">Total</th>
                    <th className="px-5 py-4 font-semibold text-slate-600">Paid</th>
                    <th className="px-5 py-4 font-semibold text-slate-600">Outstanding</th>
                    <th className="px-5 py-4 font-semibold text-slate-600">Status</th>
                    <th className="px-5 py-4 font-semibold text-slate-600">Due Date</th>
                    <th className="px-5 py-4 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <div>{invoice.sessionName}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {invoice.termName}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {invoice.studentCount}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </td>
                      <td className="px-5 py-4 text-emerald-700">
                        {formatCurrency(invoice.amountPaid, invoice.currency)}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {formatCurrency(invoice.outstandingBalance, invoice.currency)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(invoice.status)}`}>
                          {invoice.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/billing/invoices/${invoice.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          View / Print
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

