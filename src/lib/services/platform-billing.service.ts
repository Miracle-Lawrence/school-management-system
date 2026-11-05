import { randomUUID } from "node:crypto";
import { db } from "@/prisma/db";

function toKobo(value: number): number {
  const kobo = Math.round(value * 100);

  if (
    !Number.isSafeInteger(kobo) ||
    kobo <= 0 ||
    Math.abs(value * 100 - kobo) > 0.000001
  ) {
    throw new Error("Amount must be a positive value with no more than two decimal places.");
  }

  return kobo;
}

export async function getPlatformBillingOverview() {
  const [schools, rates] = await Promise.all([
    db.orm.public.School.all(),
    db.orm.public.SchoolBillingRate.all(),
  ]);

  return {
    schools: schools.map((school) => ({
      id: school.id,
      name: school.name,
      status: school.status,
    })),
    rates,
  };
}

export async function saveSchoolBillingRate(input: {
  schoolId: number;
  ratePerStudent: number;
  currency?: string;
  notes?: string | null;
  createdById: number;
}) {
  const { schoolId, ratePerStudent, createdById } = input;

  if (!Number.isSafeInteger(schoolId) || schoolId <= 0) {
    throw new Error("Invalid school.");
  }

  if (!Number.isSafeInteger(createdById) || createdById <= 0) {
    throw new Error("Invalid platform user.");
  }

  const rateKobo = toKobo(ratePerStudent);
  const school = await db.orm.public.School.where({ id: schoolId }).first();

  if (!school) {
    throw new Error("School not found.");
  }

  const existing = await db.orm.public.SchoolBillingRate.where({
    schoolId,
  }).first();

  const values = {
    ratePerStudent: (rateKobo / 100).toFixed(2),
    currency: input.currency ?? "NGN",
    isActive: true,
    notes: input.notes?.trim() || null,
    createdById,
  };

  if (existing) {
    return db.orm.public.SchoolBillingRate.where({
      id: existing.id,
    }).update(values);
  }

  return db.orm.public.SchoolBillingRate.create({
    schoolId,
    ...values,
  });
}

export async function createPlatformInvoice(input: {
  schoolId: number;
  academicSessionId: number;
  termId: number;
  createdById: number;
  dueDate?: string | null;
  notes?: string | null;
}) {
  const {
    schoolId,
    academicSessionId,
    termId,
    createdById,
  } = input;

  if (
    !Number.isSafeInteger(schoolId) ||
    schoolId <= 0 ||
    !Number.isSafeInteger(academicSessionId) ||
    academicSessionId <= 0 ||
    !Number.isSafeInteger(termId) ||
    termId <= 0 ||
    !Number.isSafeInteger(createdById) ||
    createdById <= 0
  ) {
    throw new Error("Invalid invoice details.");
  }

  const [school, session, term, rate, settingsList, students] =
    await Promise.all([
      db.orm.public.School.where({ id: schoolId }).first(),
      db.orm.public.AcademicSession.where({
        id: academicSessionId,
        schoolId,
      }).first(),
      db.orm.public.Term.where({
        id: termId,
        sessionId: academicSessionId,
      }).first(),
      db.orm.public.SchoolBillingRate.where({
        schoolId,
        isActive: true,
      }).first(),
      db.orm.public.PlatformSetting.all(),
      db.orm.public.Student.where((item) =>
        item.schoolId.eq(schoolId),
      )
        .where((item) => item.isActive.eq(true))
        .all(),
    ]);

  if (!school) {
    throw new Error("School not found.");
  }

  if (!session) {
    throw new Error("Academic session does not belong to this school.");
  }

  if (!term) {
    throw new Error("Term does not belong to the selected academic session.");
  }

  if (!rate) {
    throw new Error("Set an active billing rate for this school first.");
  }

  const studentCount = students.length;

  if (studentCount <= 0) {
    throw new Error("This school has no active students to invoice.");
  }

  const rateKobo = toKobo(Number(rate.ratePerStudent));
  const totalKobo = studentCount * rateKobo;

  if (!Number.isSafeInteger(totalKobo) || totalKobo <= 0) {
    throw new Error("The calculated invoice amount is invalid.");
  }

  const settings = settingsList[0] ?? null;

  const schoolBrandSnapshot = JSON.stringify({
    name: school.name,
    logoUrl: school.logoUrl,
    motto: school.motto,
    email: school.email,
    phone: school.phone,
    address: school.address,
    city: school.city,
    state: school.state,
    country: school.country,
    website: school.website,
    primaryColor: school.primaryColor,
    secondaryColor: school.secondaryColor,
    accentColor: school.accentColor,
  });

  const platformBrandSnapshot = JSON.stringify({
    platformName: settings?.platformName ?? "Platform",
    logoUrl: settings?.logoUrl ?? null,
    primaryColor: settings?.primaryColor ?? null,
    secondaryColor: settings?.secondaryColor ?? null,
    accentColor: settings?.accentColor ?? null,
    supportEmail: settings?.supportEmail ?? null,
    supportPhone: settings?.supportPhone ?? null,
    website: settings?.website ?? null,
    businessAddress: settings?.businessAddress ?? null,
    invoiceFooterText: settings?.invoiceFooterText ?? null,
  });

  const invoiceNumber = `INV-${schoolId}-${randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;

  return db.transaction(async (tx) => {
    const existing = await tx.orm.public.PlatformSubscriptionInvoice.where({
      schoolId,
      academicSessionId,
      termId,
    }).first();

    if (existing) {
      throw new Error("An invoice already exists for this school, session, and term.");
    }

    return tx.orm.public.PlatformSubscriptionInvoice.create({
      schoolId,
      academicSessionId,
      termId,
      invoiceNumber,
      studentCount,
      ratePerStudent: (rateKobo / 100).toFixed(2),
      totalAmount: (totalKobo / 100).toFixed(2),
      currency: rate.currency,
      status: "ISSUED",
      dueDate: input.dueDate
        ? new Date(`${input.dueDate}T00:00:00.000Z`).toISOString()
        : null,
      notes: input.notes?.trim() || null,
      schoolBrandSnapshot,
      platformBrandSnapshot,
      createdById,
    });
  });
}



export async function recordPlatformPayment(input: {
  invoiceId: number;
  amount: number;
  method: "BANK_TRANSFER" | "CASH";
  recordedById: number;
  paymentReference?: string | null;
  notes?: string | null;
}) {
  const {
    invoiceId,
    amount,
    method,
    recordedById,
  } = input;

  if (
    !Number.isSafeInteger(invoiceId) ||
    invoiceId <= 0 ||
    !Number.isSafeInteger(recordedById) ||
    recordedById <= 0
  ) {
    throw new Error("Invalid payment details.");
  }

  if (!["BANK_TRANSFER", "CASH"].includes(method)) {
    throw new Error("Invalid payment method.");
  }

  const amountKobo = toKobo(amount);

  return db.transaction(async (tx) => {
    const invoice = await tx.orm.public.PlatformSubscriptionInvoice.where({
      id: invoiceId,
    }).first();

    if (!invoice) {
      throw new Error("Platform invoice not found.");
    }

    if (!["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status)) {
      throw new Error("This invoice is not available for payment.");
    }

    // Acquire a database row lock before calculating the outstanding balance.
    await tx.orm.public.PlatformSubscriptionInvoice.where({
      id: invoiceId,
    }).update({
      status: invoice.status,
    });

    // Reread after acquiring the lock.
    const lockedInvoice =
      await tx.orm.public.PlatformSubscriptionInvoice.where({
        id: invoiceId,
      }).first();

    if (
      !lockedInvoice ||
      !["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(lockedInvoice.status)
    ) {
      throw new Error("This invoice is no longer available for payment.");
    }

    const confirmedPayments =
      await tx.orm.public.PlatformSubscriptionPayment.where((item) =>
        item.invoiceId.eq(invoiceId),
      )
        .where((item) => item.status.eq("CONFIRMED"))
        .all();

    const confirmedKobo = confirmedPayments.reduce(
      (total, payment) =>
        total + Math.round(Number(payment.amount) * 100),
      0,
    );

    const totalKobo = Math.round(Number(lockedInvoice.totalAmount) * 100);
    const outstandingKobo = totalKobo - confirmedKobo;

    if (outstandingKobo <= 0) {
      throw new Error("This invoice has already been paid in full.");
    }

    if (amountKobo > outstandingKobo) {
      throw new Error(
        `Payment exceeds the outstanding balance of NGN ${(outstandingKobo / 100).toFixed(2)}.`,
      );
    }

    const now = new Date().toISOString();
    const receiptNumber = `RCP-${randomUUID().toUpperCase()}`;

    const payment = await tx.orm.public.PlatformSubscriptionPayment.create({
      invoiceId,
      amount: (amountKobo / 100).toFixed(2),
      method,
      status: "CONFIRMED",
      receiptNumber,
      paymentReference: input.paymentReference?.trim() || null,
      paidAt: now,
      confirmedAt: now,
      confirmedById: recordedById,
      recordedById,
      notes: input.notes?.trim() || null,
      schoolBrandSnapshot: lockedInvoice.schoolBrandSnapshot,
      platformBrandSnapshot: lockedInvoice.platformBrandSnapshot,
    });

    const newPaidKobo = confirmedKobo + amountKobo;
    const newOutstandingKobo = totalKobo - newPaidKobo;
    const newStatus =
      newOutstandingKobo === 0 ? "PAID" : "PARTIALLY_PAID";

    await tx.orm.public.PlatformSubscriptionInvoice.where({
      id: invoiceId,
    }).update({
      status: newStatus,
    });

    return {
      payment,
      invoiceNumber: lockedInvoice.invoiceNumber,
      invoiceTotal: (totalKobo / 100).toFixed(2),
      amountPaid: (newPaidKobo / 100).toFixed(2),
      outstandingBalance: (newOutstandingKobo / 100).toFixed(2),
      invoiceStatus: newStatus,
    };
  });
}


export async function getPlatformInvoice(invoiceId: number) {
  if (!Number.isSafeInteger(invoiceId) || invoiceId <= 0) {
    throw new Error("Invalid invoice ID.");
  }

  const invoice =
    await db.orm.public.PlatformSubscriptionInvoice.where({
      id: invoiceId,
    }).first();

  if (!invoice) {
    throw new Error("Platform invoice not found.");
  }

  const [payments, session, term] = await Promise.all([
    db.orm.public.PlatformSubscriptionPayment.where((item) =>
      item.invoiceId.eq(invoiceId),
    ).all(),

    db.orm.public.AcademicSession.where({
      id: invoice.academicSessionId,
    }).first(),

    db.orm.public.Term.where({
      id: invoice.termId,
    }).first(),
  ]);

  const confirmedPayments = payments.filter(
    (payment) => payment.status === "CONFIRMED",
  );

  const totalKobo = Math.round(Number(invoice.totalAmount) * 100);

  const paidKobo = confirmedPayments.reduce(
    (total, payment) =>
      total + Math.round(Number(payment.amount) * 100),
    0,
  );

  return {
    ...invoice,
    sessionName: session?.name ?? "Unknown session",
    termName: term?.name ?? "Unknown term",
    amountPaid: (paidKobo / 100).toFixed(2),
    outstandingBalance: (
      Math.max(0, totalKobo - paidKobo) / 100
    ).toFixed(2),
    payments: [...payments].sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt) || b.id - a.id,
    ),
  };
}


export async function getSchoolPlatformInvoices(schoolId: number) {
  if (!Number.isSafeInteger(schoolId) || schoolId <= 0) {
    throw new Error("Invalid school ID.");
  }

  const invoices = await db.orm.public.PlatformSubscriptionInvoice.where({
    schoolId,
  }).all();

  if (invoices.length === 0) {
    return [];
  }

  const invoiceIds = invoices.map((invoice) => invoice.id);
  const sessionIds = [
    ...new Set(invoices.map((invoice) => invoice.academicSessionId)),
  ];
  const termIds = [...new Set(invoices.map((invoice) => invoice.termId))];

  const [payments, sessions, terms] = await Promise.all([
    db.orm.public.PlatformSubscriptionPayment.where((item) =>
      item.invoiceId.in(invoiceIds),
    ).all(),

    db.orm.public.AcademicSession.where((item) =>
      item.id.in(sessionIds),
    ).all(),

    db.orm.public.Term.where((item) =>
      item.id.in(termIds),
    ).all(),
  ]);

  return invoices
    .map((invoice) => {
      const invoicePayments = payments.filter(
        (payment) => payment.invoiceId === invoice.id,
      );

      const confirmedPayments = invoicePayments.filter(
        (payment) => payment.status === "CONFIRMED",
      );

      const paidKobo = confirmedPayments.reduce(
        (total, payment) =>
          total + Math.round(Number(payment.amount) * 100),
        0,
      );

      const totalKobo = Math.round(Number(invoice.totalAmount) * 100);

      return {
        ...invoice,
        sessionName:
          sessions.find(
            (session) => session.id === invoice.academicSessionId,
          )?.name ?? "Unknown session",
        termName:
          terms.find((term) => term.id === invoice.termId)?.name ??
          "Unknown term",
        amountPaid: (paidKobo / 100).toFixed(2),
        outstandingBalance: (
          Math.max(0, totalKobo - paidKobo) / 100
        ).toFixed(2),
        payments: [...invoicePayments].sort(
          (a, b) =>
            b.createdAt.localeCompare(a.createdAt) || b.id - a.id,
        ),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}


export async function getPlatformPaymentReceipt(
  paymentId: number,
  schoolId?: number,
) {
  if (!Number.isSafeInteger(paymentId) || paymentId <= 0) {
    throw new Error("Invalid payment ID.");
  }

  if (
    schoolId !== undefined &&
    (!Number.isSafeInteger(schoolId) || schoolId <= 0)
  ) {
    throw new Error("Invalid school ID.");
  }

  const payment = await db.orm.public.PlatformSubscriptionPayment.where({
    id: paymentId,
  }).first();

  if (!payment) {
    throw new Error("Payment not found.");
  }

  if (payment.status !== "CONFIRMED" || !payment.receiptNumber) {
    throw new Error("Only confirmed payments with receipts can be retrieved.");
  }

  const invoice =
    await db.orm.public.PlatformSubscriptionInvoice.where({
      id: payment.invoiceId,
    }).first();

  if (!invoice || (schoolId !== undefined && invoice.schoolId !== schoolId)) {
    throw new Error("Payment not found for this school.");
  }

  const [session, term, invoicePayments] = await Promise.all([
    db.orm.public.AcademicSession.where({
      id: invoice.academicSessionId,
    }).first(),

    db.orm.public.Term.where({
      id: invoice.termId,
    }).first(),

    db.orm.public.PlatformSubscriptionPayment.where((item) =>
      item.invoiceId.eq(invoice.id),
    ).all(),
  ]);

  const confirmedPayments = invoicePayments
    .filter((item) => item.status === "CONFIRMED")
    .sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id - b.id,
    );

  const paymentIndex = confirmedPayments.findIndex(
    (item) => item.id === payment.id,
  );

  if (paymentIndex === -1) {
    throw new Error("Confirmed payment could not be verified.");
  }

  const previousPaidKobo = confirmedPayments
    .slice(0, paymentIndex)
    .reduce(
      (total, item) =>
        total + Math.round(Number(item.amount) * 100),
      0,
    );

  const totalKobo = Math.round(Number(invoice.totalAmount) * 100);
  const currentPaymentKobo = Math.round(Number(payment.amount) * 100);

  return {
    receiptNumber: payment.receiptNumber,
    school: JSON.parse(payment.schoolBrandSnapshot),
    platform: JSON.parse(payment.platformBrandSnapshot),
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      studentCount: invoice.studentCount,
      ratePerStudent: Number(invoice.ratePerStudent).toFixed(2),
      totalAmount: (totalKobo / 100).toFixed(2),
      currency: invoice.currency,
      sessionName: session?.name ?? "Unknown session",
      termName: term?.name ?? "Unknown term",
    },
    payment: {
      id: payment.id,
      receiptNumber: payment.receiptNumber,
      amount: (currentPaymentKobo / 100).toFixed(2),
      method: payment.method,
      paymentReference: payment.paymentReference,
      paidAt: payment.paidAt,
      confirmedAt: payment.confirmedAt,
      notes: payment.notes,
      previousBalance: (
        Math.max(0, totalKobo - previousPaidKobo) / 100
      ).toFixed(2),
      remainingBalance: (
        Math.max(
          0,
          totalKobo - previousPaidKobo - currentPaymentKobo,
        ) / 100
      ).toFixed(2),
    },
  };
}
