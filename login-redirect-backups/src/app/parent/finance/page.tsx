import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import PayButton from "./pay-button";
import CheckPaymentStatusButton from "./check-payment-status-button";

function formatMoney(amountKobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amountKobo / 100);
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ParentFinancePage() {
  const session = await requireRole(["PARENT"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (!schoolId || !Number.isInteger(userId)) {
    redirect("/login");
  }

  const user = await db.orm.public.User.where((item) =>
    item.id.eq(userId),
  ).first();

  if (!user || !user.isActive) {
    redirect("/login");
  }

  if (user.mustChangePassword) {
    redirect("/parent/change-password");
  }

  const parent = await db.orm.public.Parent.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!parent || parent.schoolId !== schoolId) {
    return (
      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h1 className="font-semibold text-amber-900">
            Parent profile not linked
          </h1>

          <p className="mt-2 text-sm text-amber-800">
            Contact your school administrator to link your parent account before
            accessing financial records.
          </p>
        </section>
      </main>
    );
  }

  const links = await db.orm.public.ParentStudent.where((item) =>
    item.parentId.eq(parent.id),
  ).all();

  const linkedStudentIds = [...new Set(links.map((item) => item.studentId))];

  const children =
    linkedStudentIds.length > 0
      ? await db.orm.public.Student.where((item) =>
          item.id.in(linkedStudentIds),
        )
          .where((item) => item.schoolId.eq(schoolId))
          .all()
      : [];

  const childIds = children.map((item) => item.id);

  const invoices =
    childIds.length > 0
      ? await db.orm.public.StudentInvoice.where((item) =>
          item.schoolId.eq(schoolId),
        )
          .where((item) => item.studentId.in(childIds))
          .where((item) => item.status.eq("ISSUED"))
          .all()
      : [];

  const invoiceIds = invoices.map((item) => item.id);
  const sessionIds = [...new Set(invoices.map((item) => item.sessionId))];
  const termIds = [...new Set(invoices.map((item) => item.termId))];

  const [payments, sessions, terms] = await Promise.all([
    invoiceIds.length > 0
      ? db.orm.public.FeePayment.where((item) =>
          item.invoiceId.in(invoiceIds),
        ).all()
      : Promise.resolve([]),

    sessionIds.length > 0
      ? db.orm.public.AcademicSession.where((item) =>
          item.id.in(sessionIds),
        ).all()
      : Promise.resolve([]),

    termIds.length > 0
      ? db.orm.public.Term.where((item) => item.id.in(termIds)).all()
      : Promise.resolve([]),
  ]);

  const childMap = new Map(children.map((item) => [item.id, item]));
  const sessionMap = new Map(sessions.map((item) => [item.id, item.name]));
  const termMap = new Map(terms.map((item) => [item.id, item.name]));

  // Track pending Paystack payments so parents can check their status.
  const pendingPaystackByInvoice = new Map<number, string>();

  for (const payment of payments) {
    if (payment.method === "PAYSTACK" && payment.status === "PENDING") {
      pendingPaystackByInvoice.set(payment.invoiceId, payment.reference);
    }
  }

  // Calculate confirmed payments for each invoice.
  const paidByInvoice = new Map<number, number>();

  for (const payment of payments) {
    if (payment.status !== "CONFIRMED") continue;

    const amountKobo = Math.round(Number(payment.amount) * 100);

    paidByInvoice.set(
      payment.invoiceId,
      (paidByInvoice.get(payment.invoiceId) ?? 0) + amountKobo,
    );
  }

  const invoiceRows = invoices
    .map((invoice) => {
      const totalKobo = Math.round(Number(invoice.totalAmount) * 100);
      const paidKobo = paidByInvoice.get(invoice.id) ?? 0;

      return {
        invoice,
        child: childMap.get(invoice.studentId),
        sessionName: sessionMap.get(invoice.sessionId) ?? "—",
        termName: termMap.get(invoice.termId) ?? "—",
        totalKobo,
        paidKobo,
        outstandingKobo: Math.max(0, totalKobo - paidKobo),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.invoice.createdAt).getTime() -
        new Date(a.invoice.createdAt).getTime(),
    );

  const totalInvoicedKobo = invoiceRows.reduce(
    (total, row) => total + row.totalKobo,
    0,
  );

  const totalPaidKobo = invoiceRows.reduce(
    (total, row) => total + row.paidKobo,
    0,
  );

  const totalOutstandingKobo = invoiceRows.reduce(
    (total, row) => total + row.outstandingKobo,
    0,
  );

  const invoiceRowMap = new Map(
    invoiceRows.map((row) => [row.invoice.id, row]),
  );

  const paymentRows = payments
    .map((payment) => {
      const row = invoiceRowMap.get(payment.invoiceId);

      return row ? { payment, row } : null;
    })
    .filter((item) => item !== null)
    .sort(
      (a, b) =>
        new Date(b.payment.createdAt).getTime() -
        new Date(a.payment.createdAt).getTime(),
    );

  const summary = [
    {
      label: "Total invoiced",
      value: formatMoney(totalInvoicedKobo),
      description: `${invoiceRows.length} issued invoice(s)`,
      color: "text-slate-900",
    },
    {
      label: "Amount paid",
      value: formatMoney(totalPaidKobo),
      description: "Confirmed payments",
      color: "text-emerald-700",
    },
    {
      label: "Outstanding balance",
      value: formatMoney(totalOutstandingKobo),
      description: "Remaining on issued invoices",
      color: "text-amber-700",
    },
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header>
        <Link
          href="/parent/dashboard"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          ← Back to parent dashboard
        </Link>

        <p className="mt-4 text-sm font-semibold text-blue-600">
          Family portal
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          School fees and payments
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          View invoices, confirmed payments, and outstanding balances for your
          linked children.
        </p>
      </header>

      {/* Finance summary */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summary.map((item) => (
          <article
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-600">{item.label}</p>

            <p className={`mt-3 text-2xl font-bold ${item.color}`}>
              {item.value}
            </p>

            <p className="mt-2 text-xs text-slate-500">{item.description}</p>
          </article>
        ))}
      </section>

      {/* Invoices and payment actions */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            My children&apos;s invoices
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Only issued invoices for your linked children are displayed. You can
            pay any invoice with an outstanding balance.
          </p>
        </div>

        {invoiceRows.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No issued invoices were found for your linked children.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3 font-medium">Invoice</th>
                  <th className="p-3 font-medium">Student</th>
                  <th className="p-3 font-medium">Session / term</th>
                  <th className="p-3 text-right font-medium">Total</th>
                  <th className="p-3 text-right font-medium">Paid</th>
                  <th className="p-3 text-right font-medium">Balance</th>
                  <th className="p-3 font-medium">Payment</th>
                </tr>
              </thead>

              <tbody>
                {invoiceRows.map((row) => {
                  const pendingReference = pendingPaystackByInvoice.get(
                    row.invoice.id,
                  );

                  return (
                    <tr
                      key={row.invoice.id}
                      className="border-t border-slate-100"
                    >
                      <td className="whitespace-nowrap p-3 font-medium text-slate-900">
                        {row.invoice.invoiceNumber}
                      </td>

                      <td className="whitespace-nowrap p-3">
                        {row.child
                          ? `${row.child.firstName} ${row.child.lastName}`
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap p-3 text-slate-600">
                        {row.sessionName}
                        <span className="block text-xs text-slate-500">
                          {row.termName}
                        </span>
                      </td>

                      <td className="whitespace-nowrap p-3 text-right">
                        {formatMoney(row.totalKobo)}
                      </td>

                      <td className="whitespace-nowrap p-3 text-right text-emerald-700">
                        {formatMoney(row.paidKobo)}
                      </td>

                      <td className="whitespace-nowrap p-3 text-right font-semibold text-amber-700">
                        {formatMoney(row.outstandingKobo)}
                      </td>

                      <td className="whitespace-nowrap p-3">
                        {row.outstandingKobo <= 0 ? (
                          <span className="text-xs font-medium text-emerald-700">
                            Fully paid
                          </span>
                        ) : pendingReference ? (
                          <CheckPaymentStatusButton
                            reference={pendingReference}
                          />
                        ) : (
                          <PayButton invoiceId={row.invoice.id} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payment history and receipts */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Payment history
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Payment records associated with your children&apos;s issued
            invoices.
          </p>
        </div>

        {paymentRows.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No payment records were found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Student</th>
                  <th className="p-3 font-medium">Reference</th>
                  <th className="p-3 font-medium">Method</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 text-right font-medium">Amount</th>
                  <th className="p-3 font-medium">Receipt</th>
                </tr>
              </thead>

              <tbody>
                {paymentRows.map(({ payment, row }) => (
                  <tr key={payment.id} className="border-t border-slate-100">
                    <td className="whitespace-nowrap p-3">
                      {formatDate(payment.paidAt ?? payment.createdAt)}
                    </td>

                    <td className="whitespace-nowrap p-3">
                      {row.child
                        ? `${row.child.firstName} ${row.child.lastName}`
                        : "—"}
                    </td>

                    <td className="max-w-48 break-all p-3 text-xs text-slate-600">
                      {payment.reference}
                    </td>

                    <td className="whitespace-nowrap p-3">
                      {payment.method.replace("_", " ")}
                    </td>

                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          payment.status === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800"
                            : payment.status === "FAILED"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap p-3 text-right font-semibold">
                      {formatMoney(Math.round(Number(payment.amount) * 100))}
                    </td>

                    <td className="whitespace-nowrap p-3">
                      {payment.status === "CONFIRMED" ? (
                        <Link
                          href={`/parent/finance/${payment.id}/receipt`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-700 hover:underline"
                        >
                          View receipt
                        </Link>
                      ) : (
                        <span className="text-slate-400">Unavailable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Financial summaries include issued invoices and confirmed payments.
        Receipts are available only for confirmed payments and must be
        authorized against your linked children. Online payments remain
        unconfirmed until payment verification succeeds.
      </p>
    </main>
  );
}
