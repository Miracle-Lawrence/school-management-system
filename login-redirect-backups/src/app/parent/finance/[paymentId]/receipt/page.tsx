import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { getFeePaymentReceipt } from "@/lib/services/student-invoice.service";
import { db } from "@/prisma/db";
import PrintButton from "@/app/school/fee-payments/[paymentId]/receipt/print-button";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ paymentId: string }>;
};

function formatMoney(value: string | number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function ParentPaymentReceiptPage({ params }: PageProps) {
  const session = await requireRole(["PARENT"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (!schoolId || !Number.isSafeInteger(userId)) {
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

  const { paymentId: paymentIdParam } = await params;
  const paymentId = Number(paymentIdParam);

  if (!Number.isSafeInteger(paymentId) || paymentId <= 0) {
    notFound();
  }

  const parent = await db.orm.public.Parent.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!parent || parent.schoolId !== schoolId) {
    notFound();
  }

  const links = await db.orm.public.ParentStudent.where((item) =>
    item.parentId.eq(parent.id),
  ).all();

  const linkedStudentIds = [...new Set(links.map((item) => item.studentId))];

  if (linkedStudentIds.length === 0) {
    notFound();
  }

  const payment = await db.orm.public.FeePayment.where((item) =>
    item.id.eq(paymentId),
  ).first();

  if (!payment || payment.status !== "CONFIRMED") {
    notFound();
  }

  const invoice = await db.orm.public.StudentInvoice.where((item) =>
    item.id.eq(payment.invoiceId),
  ).first();

  if (
    !invoice ||
    invoice.schoolId !== schoolId ||
    !linkedStudentIds.includes(invoice.studentId)
  ) {
    notFound();
  }

  let receipt;

  try {
    receipt = await getFeePaymentReceipt(schoolId, paymentId);
  } catch {
    notFound();
  }

  const {
    school,
    student,
    invoice: receiptInvoice,
    payment: receiptPayment,
  } = receipt;

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/parent/finance"
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          ← Back to parent finance
        </Link>

        <PrintButton />
      </div>

      <article className="rounded-xl border bg-white p-6 text-gray-900 shadow-sm sm:p-10 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="border-b-2 border-gray-200 pb-6 text-center">
          {school.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={school.logoUrl}
              alt={`${school.name} logo`}
              className="mx-auto mb-3 max-h-20 max-w-40 object-contain"
            />
          )}

          <h1 className="text-2xl font-bold">{school.name}</h1>

          {school.motto && (
            <p className="mt-1 text-sm italic text-gray-600">{school.motto}</p>
          )}

          <p className="mt-2 text-sm text-gray-600">
            {[school.address, school.city, school.state, school.country]
              .filter(Boolean)
              .join(", ")}
          </p>

          <p className="mt-1 text-sm text-gray-600">
            {[school.phone, school.email, school.website]
              .filter(Boolean)
              .join(" | ")}
          </p>

          <h2 className="mt-6 text-xl font-bold uppercase tracking-wider">
            Official Payment Receipt
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Receipt No: {receiptPayment.receiptNumber}
          </p>
        </header>

        <section className="grid gap-5 border-b py-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Student details
            </h3>
            <p className="font-semibold">
              {student.firstName}{" "}
              {student.middleName ? `${student.middleName} ` : ""}
              {student.lastName}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Admission No: {student.admissionNumber}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Payment details
            </h3>
            <p className="text-sm">
              <span className="font-medium">Date:</span>{" "}
              {formatDate(receiptPayment.paidAt ?? receiptPayment.createdAt)}
            </p>
            <p className="mt-1 text-sm">
              <span className="font-medium">Method:</span>{" "}
              {receiptPayment.method.replace("_", " ")}
            </p>
            <p className="mt-1 break-all text-sm">
              <span className="font-medium">Reference:</span>{" "}
              {receiptPayment.reference}
            </p>
            <p className="mt-1 text-sm">
              <span className="font-medium">Recorded by:</span>{" "}
              {receiptPayment.recordedByName}
            </p>
          </div>
        </section>

        <section className="py-6">
          <h3 className="mb-3 font-semibold">Invoice information</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-3 text-gray-600">Invoice number</td>
                  <td className="py-3 text-right font-medium">
                    {receiptInvoice.invoiceNumber}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-gray-600">Academic session</td>
                  <td className="py-3 text-right">
                    {receiptInvoice.sessionName}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-gray-600">Term</td>
                  <td className="py-3 text-right">{receiptInvoice.termName}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-gray-600">Invoice total</td>
                  <td className="py-3 text-right font-medium">
                    {formatMoney(receiptInvoice.totalAmount)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-gray-600">Balance before payment</td>
                  <td className="py-3 text-right">
                    {formatMoney(receiptPayment.previousBalance)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-semibold">Amount received</td>
                  <td className="py-3 text-right text-lg font-bold">
                    {formatMoney(receiptPayment.amount)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold">Balance after payment</td>
                  <td className="py-3 text-right font-semibold">
                    {formatMoney(receiptPayment.remainingBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {receiptPayment.notes && (
          <section className="border-t py-4">
            <h3 className="font-semibold">Payment notes</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
              {receiptPayment.notes}
            </p>
          </section>
        )}

        <footer className="mt-6 border-t pt-6 text-center">
          <p className="font-semibold text-green-700">PAYMENT CONFIRMED</p>
          <p className="mt-2 text-sm text-gray-600">
            Thank you. Please retain this receipt for your records.
          </p>
          <p className="mt-6 text-xs text-gray-400">
            Generated electronically by the school management system.
          </p>
        </footer>
      </article>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            background: white !important;
          }
        }
      `}</style>
    </main>
  );
}
