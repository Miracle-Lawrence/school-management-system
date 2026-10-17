"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

type StudentOption = {
  id: number;
  admissionNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  classId: number | null;
};

type ClassOption = {
  id: number;
  name: string;
};

type SessionOption = {
  id: number;
  name: string;
};

type TermOption = {
  id: number;
  sessionId: number;
  name: string;
};

type CategoryOption = {
  id: number;
  name: string;
};

type StructureOption = {
  id: number;
  categoryId: number;
  classId: number;
  sessionId: number;
  termId: number;
  amount: string;
  isMandatory: boolean;
};

type InvoiceItem = {
  id?: number;
  categoryId: number | null;
  description: string;
  quantity: number;
  amount: string;
};

type FeePayment = {
  id: number;
  amount: string;
  method: "CASH" | "BANK_TRANSFER" | "PAYSTACK" | "OTHER";
  status: "PENDING" | "CONFIRMED" | "FAILED" | "REFUNDED";
  reference: string;
  providerReference: string | null;
  paidAt: string | null;
  notes: string | null;
  recordedByUserId: number | null;
  recordedByName: string;
  createdAt: string;
};

type Invoice = {
  id: number;
  invoiceNumber: string;
  studentId: number;
  sessionId: number;
  termId: number;
  type: "TERM" | "ONE_OFF";
  status: "DRAFT" | "ISSUED" | "CANCELLED";
  title: string | null;
  totalAmount: string;
  dueDate: string | null;
  createdAt: string;
  student: {
    id: number;
    admissionNumber: string;
    firstName: string;
    lastName: string;
  } | null;
  sessionName: string;
  termName: string;
  items: InvoiceItem[];
  amountPaid: string;
  outstandingBalance: string;
  payments: FeePayment[];
};

type InvoiceData = {
  students: StudentOption[];
  classes: ClassOption[];
  sessions: SessionOption[];
  terms: TermOption[];
  categories: CategoryOption[];
  structures: StructureOption[];
  invoices: Invoice[];
};

const EMPTY_DATA: InvoiceData = {
  students: [],
  classes: [],
  sessions: [],
  terms: [],
  categories: [],
  structures: [],
  invoices: [],
};

function formatMoney(value: string | number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function studentName(student: StudentOption | Invoice["student"]) {
  if (!student) return "Unknown student";
  return `${student.firstName} ${student.lastName}`;
}

export default function StudentInvoiceManager() {
  const [data, setData] = useState<InvoiceData>(EMPTY_DATA);
  const [studentId, setStudentId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
    const [expandedInvoiceId, setExpandedInvoiceId] = useState<number | null>(
      null,
    );
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<
      "CASH" | "BANK_TRANSFER"
    >("CASH");
    const [paymentNotes, setPaymentNotes] = useState("");
    const [recordingPayment, setRecordingPayment] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/school/student-invoices", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load invoices.");
      }

      setData(result as InvoiceData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load invoice data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedStudent = data.students.find(
    (student) => String(student.id) === studentId,
  );

  const availableTerms = data.terms.filter(
    (term) => String(term.sessionId) === sessionId,
  );

  const applicableFees = useMemo(() => {
    if (!selectedStudent || !sessionId || !termId) return [];

    return data.structures
      .filter(
        (structure) =>
          structure.classId === selectedStudent.classId &&
          String(structure.sessionId) === sessionId &&
          String(structure.termId) === termId,
      )
      .map((structure) => {
        const category = data.categories.find(
          (item) => item.id === structure.categoryId,
        );

        return {
          ...structure,
          categoryName: category?.name ?? "Fee",
        };
      })
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [data, selectedStudent, sessionId, termId]);

  const previewTotal = applicableFees.reduce(
    (total, fee) => total + Number(fee.amount),
    0,
  );

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return data.invoices;

    return data.invoices.filter((invoice) =>
      [
        invoice.invoiceNumber,
        invoice.student?.admissionNumber,
        invoice.student?.firstName,
        invoice.student?.lastName,
        invoice.sessionName,
        invoice.termName,
        invoice.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [data.invoices, search]);

  async function createInvoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!studentId || !sessionId || !termId) {
      setError("Select a student, academic session, and term.");
      return;
    }

    if (applicableFees.length === 0) {
      setError("No applicable fee structures were found for this selection.");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("/api/school/student-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: Number(studentId),
          sessionId: Number(sessionId),
          termId: Number(termId),
          ...(dueDate ? { dueDate } : {}),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to generate the invoice.");
      }

      setSuccess(
        `Invoice ${result.invoice.invoiceNumber} was generated successfully.`,
      );
      setStudentId("");
      setSessionId("");
      setTermId("");
      setDueDate("");

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to generate invoice.",
      );
    } finally {
      setCreating(false);
    }
  }

    async function recordPayment(
      event: React.FormEvent<HTMLFormElement>,
      invoice: Invoice,
    ) {
      event.preventDefault();
      setError("");
      setSuccess("");

      const amount = Number(paymentAmount);

      if (!Number.isFinite(amount) || amount <= 0) {
        setError("Enter a valid payment amount.");
        return;
      }

      if (amount > Number(invoice.outstandingBalance)) {
        setError("Payment cannot exceed the outstanding balance.");
        return;
      }

      setRecordingPayment(true);

      try {
        const response = await fetch("/api/school/student-invoices", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceId: invoice.id,
            amount,
            method: paymentMethod,
            ...(paymentNotes.trim() ? { notes: paymentNotes.trim() } : {}),
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to record payment.");
        }

        setPaymentAmount("");
        setPaymentNotes("");

        await loadData();

        setSuccess(
          `Payment recorded successfully for invoice ${invoice.invoiceNumber}.`,
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to record payment.",
        );
      } finally {
        setRecordingPayment(false);
      }
    }

  const issuedCount = data.invoices.filter(
    (invoice) => invoice.status === "ISSUED",
  ).length;

  const totalInvoiced = data.invoices
    .filter((invoice) => invoice.status === "ISSUED")
    .reduce((total, invoice) => total + Number(invoice.totalAmount), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <section className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total invoices</p>
          <p className="mt-2 text-2xl font-bold">{data.invoices.length}</p>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Issued invoices</p>
          <p className="mt-2 text-2xl font-bold">{issuedCount}</p>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total invoiced</p>
          <p className="mt-2 text-2xl font-bold">
            {formatMoney(totalInvoiced)}
          </p>
        </section>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800"
        >
          {success}
        </div>
      )}

      <section className="rounded-xl border bg-card p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Generate term invoice</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a student and term to load the fees assigned to their class.
          </p>
        </div>

        <form onSubmit={createInvoice} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Student
              <select
                required
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                disabled={loading || creating}
                className="w-full rounded-lg border bg-background px-3 py-2.5"
              >
                <option value="">Select student</option>
                {data.students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.admissionNumber} — {student.lastName}{" "}
                    {student.firstName}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              Academic session
              <select
                required
                value={sessionId}
                onChange={(event) => {
                  setSessionId(event.target.value);
                  setTermId("");
                }}
                disabled={loading || creating}
                className="w-full rounded-lg border bg-background px-3 py-2.5"
              >
                <option value="">Select academic session</option>
                {data.sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              Term
              <select
                required
                value={termId}
                onChange={(event) => setTermId(event.target.value)}
                disabled={!sessionId || loading || creating}
                className="w-full rounded-lg border bg-background px-3 py-2.5"
              >
                <option value="">Select term</option>
                {availableTerms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              Due date (optional)
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                disabled={loading || creating}
                className="w-full rounded-lg border bg-background px-3 py-2.5"
              />
            </label>
          </div>

          {selectedStudent && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium">{studentName(selectedStudent)}</p>
              <p className="mt-1 text-muted-foreground">
                Admission number: {selectedStudent.admissionNumber}
              </p>
              <p className="text-muted-foreground">
                Class:{" "}
                {data.classes.find(
                  (item) => item.id === selectedStudent.classId,
                )?.name ?? "Unassigned"}
              </p>
            </div>
          )}

          {studentId && sessionId && termId && (
            <div className="space-y-3">
              <h3 className="font-semibold">Fee preview</h3>

              {applicableFees.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No active fee structures match this student, session, and
                  term.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="p-3">Fee category</th>
                        <th className="p-3">Required</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicableFees.map((fee) => (
                        <tr key={fee.id} className="border-t">
                          <td className="p-3">{fee.categoryName}</td>
                          <td className="p-3">
                            {fee.isMandatory ? "Mandatory" : "Optional"}
                          </td>
                          <td className="p-3 text-right">
                            {formatMoney(fee.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t bg-muted/30">
                      <tr>
                        <th colSpan={2} className="p-3 text-left">
                          Total invoice
                        </th>
                        <th className="p-3 text-right">
                          {formatMoney(previewTotal)}
                        </th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                The server recalculates the invoice total from saved fee
                structures when the invoice is created.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              creating ||
              !studentId ||
              !sessionId ||
              !termId ||
              applicableFees.length === 0
            }
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Generating invoice..." : "Generate invoice"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Generated invoices</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review invoices issued to your students.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoices..."
              aria-label="Search invoices"
              className="min-w-0 rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">
            Loading invoices...
          </p>
        ) : filteredInvoices.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            {search
              ? "No invoices match your search."
              : "No invoices have been generated yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3">Invoice number</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Session / term</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Balance</th>
                  <th className="p-3">Due date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payments</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <Fragment key={invoice.id}>
                    <tr key={invoice.id} className="border-t">
                      <td className="whitespace-nowrap p-3 font-medium">
                        {invoice.invoiceNumber}
                      </td>

                      <td className="p-3">
                        <p>{studentName(invoice.student)}</p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.student?.admissionNumber ?? "—"}
                        </p>
                      </td>

                      <td className="p-3">
                        <p>{invoice.sessionName}</p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.termName}
                        </p>
                      </td>

                      <td className="whitespace-nowrap p-3 text-right">
                        {formatMoney(invoice.totalAmount)}
                      </td>

                      <td className="whitespace-nowrap p-3 text-right">
                        {formatMoney(invoice.amountPaid)}
                      </td>

                      <td className="whitespace-nowrap p-3 text-right font-semibold">
                        {formatMoney(invoice.outstandingBalance)}
                      </td>

                      <td className="whitespace-nowrap p-3">
                        {formatDate(invoice.dueDate)}
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            invoice.status === "ISSUED"
                              ? "bg-green-100 text-green-800"
                              : invoice.status === "CANCELLED"
                                ? "bg-red-100 text-red-800"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap p-3">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedInvoiceId(
                              expandedInvoiceId === invoice.id
                                ? null
                                : invoice.id,
                            );
                            setPaymentAmount("");
                            setPaymentNotes("");
                            setError("");
                            setSuccess("");
                          }}
                          className="rounded-lg border px-3 py-2 text-xs font-medium"
                        >
                          {expandedInvoiceId === invoice.id
                            ? "Hide details"
                            : `Payments (${invoice.payments.length})`}
                        </button>
                      </td>
                    </tr>

                    {expandedInvoiceId === invoice.id && (
                      <tr
                        key={`${invoice.id}-payments`}
                        className="bg-muted/20"
                      >
                        <td colSpan={9} className="p-4 sm:p-6">
                          <div className="grid gap-6 lg:grid-cols-2">
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-semibold">
                                  Record a payment
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  Invoice: {invoice.invoiceNumber}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Outstanding:{" "}
                                  {formatMoney(invoice.outstandingBalance)}
                                </p>
                              </div>

                              {invoice.status !== "ISSUED" ? (
                                <p className="rounded-lg border p-3 text-sm text-muted-foreground">
                                  Payments can only be recorded against issued
                                  invoices.
                                </p>
                              ) : Number(invoice.outstandingBalance) <= 0 ? (
                                <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                                  This invoice has been paid in full.
                                </p>
                              ) : (
                                <form
                                  onSubmit={(event) =>
                                    void recordPayment(event, invoice)
                                  }
                                  className="space-y-4"
                                >
                                  <label className="block space-y-2 text-sm font-medium">
                                    Payment amount (₦)
                                    <input
                                      type="number"
                                      required
                                      min="0.01"
                                      max={invoice.outstandingBalance}
                                      step="0.01"
                                      value={paymentAmount}
                                      onChange={(event) =>
                                        setPaymentAmount(event.target.value)
                                      }
                                      disabled={recordingPayment}
                                      className="w-full rounded-lg border bg-background px-3 py-2.5"
                                      placeholder="Enter amount"
                                    />
                                  </label>

                                  <label className="block space-y-2 text-sm font-medium">
                                    Payment method
                                    <select
                                      value={paymentMethod}
                                      onChange={(event) =>
                                        setPaymentMethod(
                                          event.target.value as
                                            "CASH" | "BANK_TRANSFER",
                                        )
                                      }
                                      disabled={recordingPayment}
                                      className="w-full rounded-lg border bg-background px-3 py-2.5"
                                    >
                                      <option value="CASH">Cash</option>
                                      <option value="BANK_TRANSFER">
                                        Bank transfer
                                      </option>
                                    </select>
                                  </label>

                                  <label className="block space-y-2 text-sm font-medium">
                                    Notes (optional)
                                    <textarea
                                      rows={3}
                                      maxLength={500}
                                      value={paymentNotes}
                                      onChange={(event) =>
                                        setPaymentNotes(event.target.value)
                                      }
                                      disabled={recordingPayment}
                                      placeholder="Add a receipt note or transaction details"
                                      className="w-full rounded-lg border bg-background px-3 py-2.5"
                                    />
                                  </label>

                                  <button
                                    type="submit"
                                    disabled={
                                      recordingPayment ||
                                      !paymentAmount ||
                                      Number(paymentAmount) <= 0 ||
                                      Number(paymentAmount) >
                                        Number(invoice.outstandingBalance)
                                    }
                                    className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {recordingPayment
                                      ? "Recording payment..."
                                      : "Record payment"}
                                  </button>
                                </form>
                              )}
                            </div>

                            <div className="space-y-3">
                              <h3 className="font-semibold">Payment history</h3>

                              {invoice.payments.length === 0 ? (
                                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                  No payments have been recorded for this
                                  invoice.
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {invoice.payments.map((payment) => (
                                    <div
                                      key={payment.id}
                                      className="rounded-lg border bg-background p-4"
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <p className="font-semibold">
                                          {formatMoney(payment.amount)}
                                        </p>
                                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                                          {payment.status}
                                        </span>
                                      </div>

                                      <p className="mt-2 text-sm">
                                        {payment.method.replace("_", " ")}
                                      </p>

                                      <p className="mt-1 break-all text-xs text-muted-foreground">
                                        Reference: {payment.reference}
                                      </p>

                                      <p className="mt-1 text-xs text-muted-foreground">
                                        Date:{" "}
                                        {formatDate(
                                          payment.paidAt ?? payment.createdAt,
                                        )}
                                      </p>

                                      <p className="mt-1 text-xs text-muted-foreground">
                                        Recorded by: {payment.recordedByName}
                                      </p>

                                      {payment.notes && (
                                        <p className="mt-2 text-sm">
                                          {payment.notes}
                                        </p>
                                      )}
                                      {payment.status === "CONFIRMED" && (
                                        <a
                                          href={`/school/fee-payments/${payment.id}/receipt`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="mt-3 inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted print:hidden"
                                        >
                                          Print receipt
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
