import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { getPlatformInvoice } from "@/lib/services/platform-billing.service";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ invoiceId: string }>;
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
};

function formatMoney(value: string | number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
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

export default async function PlatformInvoicePage({ params }: PageProps) {
  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const { invoiceId: invoiceIdParam } = await params;
  const invoiceId = Number(invoiceIdParam);

  if (!Number.isSafeInteger(invoiceId) || invoiceId <= 0) {
    notFound();
  }

  let invoice;

  try {
    invoice = await getPlatformInvoice(invoiceId);
  } catch {
    notFound();
  }

  let school: Brand;
  let platform: Brand;

  try {
    school = JSON.parse(invoice.schoolBrandSnapshot) as Brand;
    platform = JSON.parse(invoice.platformBrandSnapshot) as Brand;
  } catch {
    notFound();
  }

  const platformName = platform.platformName || "Platform";
  const schoolName = school.name || "School";
  const currency = invoice.currency || "NGN";

  const schoolAddress = [
    school.address,
    school.city,
    school.state,
    school.country,
  ]
    .filter(Boolean)
    .join(", ");

  const status = invoice.status.replace(/_/g, " ");

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/dashboard/billing/invoices"
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          ← Back to invoices
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
                Platform subscription invoice
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
                Invoice number
              </p>
              <p className="mt-1 break-all text-lg font-bold text-gray-950">
                {invoice.invoiceNumber}
              </p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                Invoice date
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formatDate(invoice.createdAt)}
              </p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                Due date
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>
        </header>

        <section className="p-6 sm:p-8">
          <div className="mb-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                Bill to
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
              {school.website ? (
                <p className="mt-1 text-sm text-gray-600">{school.website}</p>
              ) : null}
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                Academic billing period
              </h2>
              <Detail label="Academic session" value={invoice.sessionName} />
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Detail label="Term" value={invoice.termName} />
                <Detail label="Active students" value={invoice.studentCount} />
                <Detail
                  label="Rate per student"
                  value={formatMoney(invoice.ratePerStudent, currency)}
                />
                <Detail label="Invoice status" value={status} />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="border-b bg-gray-50 px-4 py-3">
              <h2 className="text-sm font-bold text-gray-900">
                Invoice breakdown
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-600">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                      Rate
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-4 font-medium text-gray-900">
                      Platform subscription billing
                    </td>
                    <td className="px-4 py-4 text-right text-gray-700">
                      {invoice.studentCount}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-700">
                      {formatMoney(invoice.ratePerStudent, currency)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-gray-900">
                      {formatMoney(invoice.totalAmount, currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-3 border-t bg-gray-50 p-4">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-600">Invoice total</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(invoice.totalAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-600">Amount paid</span>
                <span className="font-semibold text-green-700">
                  {formatMoney(invoice.amountPaid, currency)}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-t pt-3">
                <span className="font-bold text-gray-900">
                  Outstanding balance
                </span>
                <span className="text-lg font-bold text-gray-950">
                  {formatMoney(invoice.outstandingBalance, currency)}
                </span>
              </div>
            </div>
          </div>

          {invoice.notes ? (
            <div className="mt-5 rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Notes
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {invoice.notes}
              </p>
            </div>
          ) : null}

          {platform.invoiceFooterText ? (
            <p className="mt-5 text-center text-xs text-gray-500">
              {platform.invoiceFooterText}
            </p>
          ) : null}

          <footer className="mt-8 border-t pt-4 text-center text-xs text-gray-500">
            <p>
              Generated by {platformName}. Please retain this invoice for your
              records.
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
            margin: 10mm;
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
            line-height: 1.3 !important;
          }

          article header {
            padding: 7mm 9mm !important;
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
          }

          article h1 {
            font-size: 18px !important;
          }

          article section {
            padding: 6mm 9mm !important;
          }

          article section > div:first-child {
            margin-bottom: 5mm !important;
            gap: 5mm !important;
          }

          article section .rounded-lg {
            padding: 3mm !important;
          }

          article section .mt-4 {
            margin-top: 2mm !important;
          }

          article section .mt-5,
          article section .mt-8 {
            margin-top: 4mm !important;
          }

          article section .p-4 {
            padding: 3mm !important;
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
        }
      `}</style>
    </main>
  );
}
