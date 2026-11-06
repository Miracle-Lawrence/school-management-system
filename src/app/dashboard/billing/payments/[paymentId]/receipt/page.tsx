import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { getPlatformPaymentReceipt } from "@/lib/services/platform-billing.service";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ paymentId: string }>;
};

type Brand = {
  name?: string | null;
  platformName?: string | null;
  logoUrl?: string | null;
  motto?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  website?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  businessAddress?: string | null;
  invoiceFooterText?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
};

function formatMoney(value: string | number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value: string | Date | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className="break-words text-sm font-semibold text-gray-900">
        {value || "—"}
      </span>
    </div>
  );
}

export default async function PlatformPaymentReceiptPage({
  params,
}: PageProps) {
  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const { paymentId: paymentIdParam } = await params;
  const paymentId = Number(paymentIdParam);

  if (!Number.isSafeInteger(paymentId) || paymentId <= 0) {
    notFound();
  }

  let receipt;

  try {
    receipt = await getPlatformPaymentReceipt(paymentId);
  } catch {
    notFound();
  }

  const school = receipt.school as Brand;
  const platform = receipt.platform as Brand;
  const { invoice, payment } = receipt;

  const schoolName = school.name || "School";
  const platformName = platform.platformName || "Platform";
  const schoolAddress = [
    school.address,
    school.city,
    school.state,
    school.country,
  ]
    .filter(Boolean)
    .join(", ");

  const currency = invoice.currency || "NGN";

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/dashboard/billing/payments"
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          ← Back to payments
        </Link>
        <PrintButton />
      </div>

      <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <header
          className="border-b-4 p-6 sm:p-8"
          style={{
            borderBottomColor: platform.primaryColor || "#1d4ed8",
          }}
        >
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div className="min-w-0">
              {platform.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={platform.logoUrl}
                  alt={`${platformName} logo`}
                  className="mb-3 max-h-16 max-w-48 object-contain"
                />
              ) : null}

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Payment receipt
              </p>
              <h1 className="mt-2 text-2xl font-bold text-gray-950">
                {platformName}
              </h1>
              {platform.businessAddress ? (
                <p className="mt-2 max-w-sm text-sm text-gray-600">
                  {platform.businessAddress}
                </p>
              ) : null}
              {platform.supportEmail ? (
                <p className="mt-1 text-sm text-gray-600">
                  {platform.supportEmail}
                </p>
              ) : null}
              {platform.supportPhone ? (
                <p className="mt-1 text-sm text-gray-600">
                  {platform.supportPhone}
                </p>
              ) : null}
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Receipt number
              </p>
              <p className="mt-1 break-all text-lg font-bold text-gray-950">
                {receipt.receiptNumber}
              </p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                Payment date
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formatDate(payment.paidAt || payment.confirmedAt)}
              </p>
            </div>
          </div>
        </header>

        <section className="p-6 sm:p-8">
          <div className="mb-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                Received from
              </h2>
              <p className="text-lg font-bold text-gray-950">{schoolName}</p>
              {school.motto ? (
                <p className="mt-1 text-sm italic text-gray-600">
                  {school.motto}
                </p>
              ) : null}
              {schoolAddress ? (
                <p className="mt-2 text-sm text-gray-600">{schoolAddress}</p>
              ) : null}
              {school.email ? (
                <p className="mt-1 text-sm text-gray-600">{school.email}</p>
              ) : null}
              {school.phone ? (
                <p className="mt-1 text-sm text-gray-600">{school.phone}</p>
              ) : null}
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                Invoice details
              </h2>
              <Detail label="Invoice number" value={invoice.invoiceNumber} />
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Detail label="Academic session" value={invoice.sessionName} />
                <Detail label="Term" value={invoice.termName} />
                <Detail
                  label="Active students"
                  value={invoice.studentCount}
                />
                <Detail
                  label="Rate per student"
                  value={formatMoney(invoice.ratePerStudent, currency)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="border-b bg-gray-50 px-4 py-3">
              <h2 className="text-sm font-bold text-gray-900">
                Payment breakdown
              </h2>
            </div>

            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-gray-600">Invoice total</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(invoice.totalAmount, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-gray-600">Balance before payment</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(payment.previousBalance, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t pt-4">
                <span className="font-semibold text-gray-900">
                  Amount received
                </span>
                <span className="text-xl font-bold text-green-700">
                  {formatMoney(payment.amount, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t pt-4 text-sm">
                <span className="font-semibold text-gray-900">
                  Remaining balance
                </span>
                <span className="font-bold text-gray-900">
                  {formatMoney(payment.remainingBalance, currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 rounded-lg border border-gray-200 p-4 sm:grid-cols-2">
            <Detail
              label="Payment method"
              value={payment.method.replaceAll("_", " ")}
            />
            <Detail
              label="Payment reference"
              value={payment.paymentReference}
            />
            <Detail
              label="Payment confirmed"
              value={formatDate(payment.confirmedAt)}
            />
            <Detail label="Payment status" value="CONFIRMED" />
          </div>

          {payment.notes ? (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Payment notes
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                {payment.notes}
              </p>
            </div>
          ) : null}

          <div className="mt-8 rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-sm font-semibold text-gray-900">
              Payment successfully received.
            </p>
            <p className="mt-1 text-xs text-gray-600">
              This receipt confirms the platform billing payment recorded
              against the invoice above.
            </p>
          </div>

          {platform.invoiceFooterText ? (
            <p className="mt-5 text-center text-xs text-gray-500">
              {platform.invoiceFooterText}
            </p>
          ) : null}

          <footer className="mt-8 border-t pt-4 text-center text-xs text-gray-500">
            <p>
              Generated by {platformName}. Please retain this receipt for
              your records.
            </p>
            {platform.website ? (
              <p className="mt-1">{platform.website}</p>
            ) : null}
          </footer>
        </section>
      </article>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          html,
          body {
            background: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          main {
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          article {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            font-size: 10px !important;
            line-height: 1.25 !important;
          }

          article header {
            padding: 7mm 9mm !important;
            border-bottom-width: 3px !important;
          }

          article header > div {
            flex-direction: row !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            gap: 5mm !important;
          }

          article header img {
            max-height: 12mm !important;
            max-width: 35mm !important;
            margin-bottom: 2mm !important;
          }

          article h1 {
            font-size: 18px !important;
            margin-top: 3px !important;
          }

          article section {
            padding: 6mm 9mm !important;
          }

          article section > div:first-child {
            margin-bottom: 4mm !important;
            gap: 4mm !important;
          }

          article section > div:first-child > div {
            gap: 2mm !important;
          }

          article section h2 {
            margin-bottom: 2mm !important;
          }

          article section .rounded-lg {
            padding: 3mm !important;
          }

          article section .space-y-4 {
            gap: 2mm !important;
            padding: 3mm !important;
          }

          article section .border-t.pt-4 {
            padding-top: 2mm !important;
          }

          article section .mt-4 {
            margin-top: 2mm !important;
          }

          article section .mt-6 {
            margin-top: 3mm !important;
          }

          article section .mt-8 {
            margin-top: 4mm !important;
          }

          article section .mt-5 {
            margin-top: 3mm !important;
          }

          article section .gap-5 {
            gap: 3mm !important;
          }

          article section .p-4 {
            padding: 3mm !important;
          }

          article section .text-xl {
            font-size: 15px !important;
          }

          article section .text-lg {
            font-size: 13px !important;
          }

          article section .text-sm {
            font-size: 10px !important;
          }

          article section .text-xs {
            font-size: 8px !important;
          }

          article footer {
            margin-top: 4mm !important;
            padding-top: 2mm !important;
          }

          article section > div,
          article section > footer {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          article {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          @page {
            size: A4;
            margin: 14mm;
          }

          body {
            background: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </main>
  );
}

