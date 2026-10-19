import Link from "next/link";
import { db } from "@/prisma/db";
import { requireRole } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    sessionId?: string;
    termId?: string;
  }>;
};

function formatMoney(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(kobo / 100);
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function FeeCollectionDashboard({
  searchParams,
}: PageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const params = await searchParams;

  const [sessions, allTerms] = await Promise.all([
    db.orm.public.AcademicSession.where((item) =>
      item.schoolId.eq(schoolId),
    ).all(),

    db.orm.public.Term.where((item) => item.id.gt(0)).all(),
  ]);

  const sessionIds = new Set(sessions.map((item) => item.id));

  const terms = allTerms.filter((term) => sessionIds.has(term.sessionId));

  const requestedSessionId = Number(params.sessionId);

  const selectedSessionId =
    params.sessionId &&
    Number.isSafeInteger(requestedSessionId) &&
    sessions.some((item) => item.id === requestedSessionId)
      ? requestedSessionId
      : null;

  const requestedTermId = Number(params.termId);

  const selectedTerm =
    params.termId && Number.isSafeInteger(requestedTermId)
      ? terms.find(
          (term) =>
            term.id === requestedTermId &&
            (!selectedSessionId || term.sessionId === selectedSessionId),
        )
      : undefined;

  const selectedTermId = selectedTerm?.id ?? null;

  // Filter invoices in PostgreSQL using the selected dashboard filters.
  const filteredInvoices =
    selectedSessionId !== null && selectedTermId !== null
      ? await db.orm.public.StudentInvoice.where((item) =>
          item.schoolId.eq(schoolId),
        )
          .where((item) => item.sessionId.eq(selectedSessionId))
          .where((item) => item.termId.eq(selectedTermId))
          .all()
      : selectedSessionId !== null
        ? await db.orm.public.StudentInvoice.where((item) =>
            item.schoolId.eq(schoolId),
          )
            .where((item) => item.sessionId.eq(selectedSessionId))
            .all()
        : selectedTermId !== null
          ? await db.orm.public.StudentInvoice.where((item) =>
              item.schoolId.eq(schoolId),
            )
              .where((item) => item.termId.eq(selectedTermId))
              .all()
          : await db.orm.public.StudentInvoice.where((item) =>
              item.schoolId.eq(schoolId),
            ).all();

  const invoiceMap = new Map(
    filteredInvoices.map((invoice) => [invoice.id, invoice]),
  );

  // Load only students associated with the filtered invoices.
  const studentIds = [
    ...new Set(filteredInvoices.map((invoice) => invoice.studentId)),
  ];

  const students =
    studentIds.length > 0
      ? await db.orm.public.Student.where((student) =>
          student.schoolId.eq(schoolId),
        )
          .where((student) => student.id.in(studentIds))
          .all()
      : [];

  const studentMap = new Map(students.map((student) => [student.id, student]));

  // Fetch payments only for invoices in the current dashboard filters.
  // All matching payments are needed for accurate financial totals.
  const invoiceIds = [...invoiceMap.keys()];

 const [payments, recentPayments] =
   invoiceIds.length > 0
     ? await Promise.all([
         // All matching payments are required for accurate financial totals.
         db.orm.public.FeePayment.where((payment) =>
           payment.invoiceId.in(invoiceIds),
         ).all(),

         // Fetch only the latest 10 payments for the transaction table.
         db.orm.public.FeePayment.where((payment) =>
           payment.invoiceId.in(invoiceIds),
         )
           .orderBy([
             (payment) => payment.createdAt.desc(),
             (payment) => payment.id.desc(),
           ])
           .limit(10)
           .all(),
       ])
     : [[], []];

  const issuedInvoices = filteredInvoices.filter(
    (invoice) => invoice.status === "ISSUED",
  );

  const issuedInvoiceIds = new Set(issuedInvoices.map((invoice) => invoice.id));

  const confirmedPayments = payments.filter(
    (payment) =>
      payment.status === "CONFIRMED" && issuedInvoiceIds.has(payment.invoiceId),
  );

  const paidByInvoice = new Map<number, number>();

  for (const payment of confirmedPayments) {
    const amountKobo = Math.round(Number(payment.amount) * 100);

    paidByInvoice.set(
      payment.invoiceId,
      (paidByInvoice.get(payment.invoiceId) ?? 0) + amountKobo,
    );
  }

  const totalInvoicedKobo = issuedInvoices.reduce(
    (total, invoice) => total + Math.round(Number(invoice.totalAmount) * 100),
    0,
  );

  const totalCollectedKobo = confirmedPayments.reduce(
    (total, payment) => total + Math.round(Number(payment.amount) * 100),
    0,
  );

  const outstandingKobo = issuedInvoices.reduce((total, invoice) => {
    const invoiceTotal = Math.round(Number(invoice.totalAmount) * 100);
    const paid = paidByInvoice.get(invoice.id) ?? 0;

    return total + Math.max(0, invoiceTotal - paid);
  }, 0);

  const collectionRate =
    totalInvoicedKobo > 0 ? (totalCollectedKobo / totalInvoicedKobo) * 100 : 0;

  const outstandingByStudent = new Map<
    number,
    { balanceKobo: number; invoiceCount: number }
  >();

  for (const invoice of issuedInvoices) {
    const totalKobo = Math.round(Number(invoice.totalAmount) * 100);
    const paidKobo = paidByInvoice.get(invoice.id) ?? 0;
    const balanceKobo = Math.max(0, totalKobo - paidKobo);

    if (balanceKobo <= 0) continue;

    const existing = outstandingByStudent.get(invoice.studentId) ?? {
      balanceKobo: 0,
      invoiceCount: 0,
    };

    outstandingByStudent.set(invoice.studentId, {
      balanceKobo: existing.balanceKobo + balanceKobo,
      invoiceCount: existing.invoiceCount + 1,
    });
  }

  const outstandingStudents = [...outstandingByStudent.entries()]
    .map(([studentId, details]) => ({
      student: studentMap.get(studentId),
      ...details,
    }))
    .filter(
      (
        item,
      ): item is typeof item & {
        student: NonNullable<typeof item.student>;
      } => Boolean(item.student),
    )
    .sort((a, b) => b.balanceKobo - a.balanceKobo)
    .slice(0, 10);

  

  const availableTerms = selectedSessionId
    ? terms.filter((term) => term.sessionId === selectedSessionId)
    : terms;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">School Finance</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Fee Collection Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Monitor invoiced fees, confirmed collections, and outstanding
            student balances.
          </p>
        </div>

        <Link
          href="/school/student-invoices"
          className="inline-flex w-fit rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Manage invoices
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          action="/school/fee-payments"
          method="GET"
          className="grid gap-4 sm:grid-cols-3"
        >
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Academic session
            <select
              name="sessionId"
              defaultValue={selectedSessionId?.toString() ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
            >
              <option value="">All sessions</option>
              {sessions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Term
            <select
              name="termId"
              defaultValue={selectedTermId?.toString() ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
            >
              <option value="">All terms</option>
              {availableTerms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Apply filters
            </button>
            <Link
              href="/school/fee-payments"
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total invoiced",
            value: formatMoney(totalInvoicedKobo),
            description: `${issuedInvoices.length} issued invoice(s)`,
            color: "text-slate-900",
          },
          {
            label: "Total collected",
            value: formatMoney(totalCollectedKobo),
            description: "Confirmed payments",
            color: "text-emerald-700",
          },
          {
            label: "Outstanding fees",
            value: formatMoney(outstandingKobo),
            description: "Remaining on issued invoices",
            color: "text-amber-700",
          },
          {
            label: "Collection rate",
            value: `${collectionRate.toFixed(1)}%`,
            description: "Collected divided by invoiced",
            color: "text-blue-700",
          },
        ].map((stat) => (
          <article
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            <p
              className={`mt-3 break-words text-2xl font-bold tracking-tight ${stat.color}`}
            >
              {stat.value}
            </p>
            <p className="mt-2 text-xs text-slate-500">{stat.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Students with outstanding fees
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Students with balances on issued invoices, ranked by amount owed.
          </p>
        </div>

        {outstandingStudents.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No outstanding balances were found for the selected filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Admission number</th>
                  <th className="p-3 text-center">Unpaid invoices</th>
                  <th className="p-3 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {outstandingStudents.map((item) => (
                  <tr
                    key={item.student.id}
                    className="border-t border-slate-100"
                  >
                    <td className="p-3 font-medium text-slate-900">
                      {item.student.firstName} {item.student.lastName}
                    </td>
                    <td className="p-3 text-slate-600">
                      {item.student.admissionNumber}
                    </td>
                    <td className="p-3 text-center">{item.invoiceCount}</td>
                    <td className="whitespace-nowrap p-3 text-right font-semibold text-amber-700">
                      {formatMoney(item.balanceKobo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent payment transactions
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            The latest payment records associated with the selected invoices.
          </p>
        </div>

        {recentPayments.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No payment records were found for the selected filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment) => {
                  const invoice = invoiceMap.get(payment.invoiceId);
                  const student = invoice
                    ? studentMap.get(invoice.studentId)
                    : undefined;

                  return (
                    <tr key={payment.id} className="border-t border-slate-100">
                      <td className="whitespace-nowrap p-3">
                        {formatDate(payment.paidAt ?? payment.createdAt)}
                      </td>
                      <td className="p-3">
                        {student
                          ? `${student.firstName} ${student.lastName}`
                          : "Unknown student"}
                      </td>
                      <td className="max-w-44 break-all p-3 text-xs text-slate-600">
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
                      <td className="p-3">
                        {payment.status === "CONFIRMED" ? (
                          <Link
                            href={`/school/fee-payments/${payment.id}/receipt`}
                            target="_blank"
                            className="font-medium text-blue-700 hover:underline"
                          >
                            View
                          </Link>
                        ) : (
                          "—"
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

      <p className="text-xs leading-5 text-slate-500">
        Financial totals include issued invoices and confirmed payments for the
        selected filters. Cancelled invoices are excluded from the invoiced,
        collected, and outstanding totals.
      </p>
    </div>
  );
}
