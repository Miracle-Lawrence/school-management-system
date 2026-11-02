import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { redirect } from "next/navigation";

function amount(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusStyle(status: string): string {
  switch (status) {
    case "CONFIRMED":
    case "PAID":
      return "bg-green-100 text-green-700";
    case "PENDING":
    case "ISSUED":
      return "bg-amber-100 text-amber-700";
    case "FAILED":
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "REFUNDED":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function methodLabel(method: string): string {
  switch (method) {
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "PAYSTACK":
      return "Paystack";
    case "CASH":
      return "Cash";
    case "OTHER":
      return "Other";
    default:
      return method.replaceAll("_", " ");
  }
}

export default async function StudentFeesPage() {
  const session = await requireRole(["STUDENT"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (!Number.isInteger(userId) || !schoolId) {
    redirect("/login");
  }

  const student = await db.orm.public.Student.where(
    (item) => item.userId.eq(userId),
  ).first();

  if (!student || !student.isActive || student.schoolId !== schoolId) {
    return (
      <main className="space-y-5">
        <h1 className="text-2xl font-bold text-slate-900">School Fees</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Your student profile is not linked to an active school record.
          Please contact your school administrator.
        </div>
      </main>
    );
  }

  const allInvoices = await db.orm.public.StudentInvoice.where(
    (item) => item.studentId.eq(student.id),
  ).all();

  const invoices = allInvoices.filter(
    (invoice) =>
      invoice.schoolId === schoolId &&
      invoice.status !== "DRAFT" &&
      invoice.status !== "CANCELLED",
  );

  const invoiceDetails = await Promise.all(
    invoices.map(async (invoice) => {
      const term = await db.orm.public.Term.where(
        (item) => item.id.eq(invoice.termId),
      ).first();

      const academicSession = await db.orm.public.AcademicSession.where(
        (item) => item.id.eq(invoice.sessionId),
      ).first();

      const items = await db.orm.public.InvoiceItem.where(
        (item) => item.invoiceId.eq(invoice.id),
      ).all();

      const payments = await db.orm.public.FeePayment.where(
        (item) => item.invoiceId.eq(invoice.id),
      ).all();

      const validPayments = payments.filter((payment) => {
        return payment.status === "CONFIRMED";
      });

      const paidAmount = validPayments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );

      const refundedAmount = payments
        .filter((payment) => payment.status === "REFUNDED")
        .reduce((sum, payment) => sum + Number(payment.amount), 0);

      const netPaid = Math.max(0, paidAmount - refundedAmount);
      const totalAmount = Number(invoice.totalAmount);
      const balance = Math.max(0, totalAmount - netPaid);

      let paymentStatus = "UNPAID";

      if (totalAmount > 0 && netPaid >= totalAmount) {
        paymentStatus = "PAID";
      } else if (netPaid > 0) {
        paymentStatus = "PARTIALLY PAID";
      }

      const paymentHistory = payments
        .filter(
          (payment) =>
            payment.status !== "REFUNDED" &&
            payment.status !== "FAILED",
        )
        .sort(
          (a, b) =>
            new Date(b.paidAt ?? b.createdAt).getTime() -
            new Date(a.paidAt ?? a.createdAt).getTime(),
        );

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        title: invoice.title || "School Fees",
        type: invoice.type,
        status: invoice.status,
        issuedAt: invoice.issuedAt,
        dueDate: invoice.dueDate,
        totalAmount,
        paidAmount: netPaid,
        balance,
        paymentStatus,
        termName: term?.name ?? "Academic Term",
        sessionName: academicSession?.name ?? "Academic Session",
        items: items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          amount: Number(item.amount),
        })),
        payments: paymentHistory.map((payment) => ({
          id: payment.id,
          amount: Number(payment.amount),
          method: methodLabel(payment.method),
          reference: payment.reference,
          status: payment.status,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        })),
      };
    }),
  );

  const totalInvoiced = invoiceDetails.reduce(
    (sum, invoice) => sum + invoice.totalAmount,
    0,
  );

  const totalPaid = invoiceDetails.reduce(
    (sum, invoice) => sum + invoice.paidAmount,
    0,
  );

  const totalOutstanding = invoiceDetails.reduce(
    (sum, invoice) => sum + invoice.balance,
    0,
  );

  const outstandingInvoices = invoiceDetails.filter(
    (invoice) => invoice.balance > 0,
  ).length;

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">School Fees</h1>
          <p className="mt-1 text-sm text-slate-500">
            View your fee invoices, outstanding balances, and payment history.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">Admission Number</p>
          <p className="mt-1 font-semibold text-slate-800">
            {student.admissionNumber}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Invoiced</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {amount(totalInvoiced)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Paid</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {amount(totalPaid)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Outstanding Balance</p>
          <p className="mt-2 text-2xl font-bold text-red-700">
            {amount(totalOutstanding)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Unpaid / Partial Invoices</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {outstandingInvoices}
          </p>
        </div>
      </section>

      {invoiceDetails.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl text-blue-700">
            ₦
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No fee invoices available
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Your school fees will appear here when the school issues an
            invoice for your account.
          </p>
        </section>
      ) : (
        <section className="space-y-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Your Invoices
          </h2>

          {invoiceDetails.map((invoice) => (
            <article
              key={invoice.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {invoice.invoiceNumber}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    {invoice.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {invoice.sessionName} · {invoice.termName}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(invoice.status)}`}
                  >
                    Invoice: {invoice.status.replaceAll("_", " ")}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(invoice.paymentStatus)}`}
                  >
                    {invoice.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Invoice Amount</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {amount(invoice.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Amount Paid</p>
                  <p className="mt-1 text-lg font-bold text-green-700">
                    {amount(invoice.paidAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Balance Due</p>
                  <p className="mt-1 text-lg font-bold text-red-700">
                    {amount(invoice.balance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Date Issued</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {formatDate(invoice.issuedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Due Date</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Invoice Type</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {invoice.type === "ONE_OFF" ? "One-off Fee" : "Term Fee"}
                  </p>
                </div>
              </div>

              {invoice.items.length > 0 && (
                <div className="border-t border-slate-200 px-5 py-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-800">
                    Invoice Breakdown
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[400px] text-left text-sm">
                      <thead className="text-xs text-slate-500">
                        <tr>
                          <th className="py-2 pr-4 font-medium">Description</th>
                          <th className="px-4 py-2 font-medium">Quantity</th>
                          <th className="py-2 pl-4 text-right font-medium">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoice.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-3 pr-4 text-slate-700">
                              {item.description}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {item.quantity}
                            </td>
                            <td className="py-3 pl-4 text-right text-slate-700">
                              {amount(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {invoice.payments.length > 0 && (
                <div className="border-t border-slate-200 px-5 py-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-800">
                    Payment History
                  </h4>
                  <div className="space-y-3">
                    {invoice.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-slate-800">
                            {amount(payment.amount)} · {payment.method}
                          </p>
                          <p className="mt-1 break-all text-xs text-slate-500">
                            Reference: {payment.reference}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(payment.paidAt ?? payment.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(payment.status)}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {invoice.balance > 0 && (
                <div className="border-t border-slate-200 bg-amber-50 px-5 py-3">
                  <p className="text-sm text-amber-800">
                    You have an outstanding balance of{" "}
                    <span className="font-semibold">
                      {amount(invoice.balance)}
                    </span>
                    . Please contact your school accounts office for payment
                    instructions.
                  </p>
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
