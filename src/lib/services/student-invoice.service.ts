import { randomUUID } from "node:crypto";
import { db } from "@/prisma/db";
import type {
  CreateFeePaymentInput,
  CreateTermInvoiceInput,
} from "@/lib/validation/student-invoice";

type CreateTermInvoiceData = CreateTermInvoiceInput & {
  schoolId: number;
};

export async function getStudentInvoiceOptions(schoolId: number) {
  const [students, classes, sessions, categories] = await Promise.all([
    db.orm.public.Student.where((item) => item.schoolId.eq(schoolId)).all(),

    db.orm.public.SchoolClass.where((item) => item.schoolId.eq(schoolId)).all(),

    db.orm.public.AcademicSession.where((item) =>
      item.schoolId.eq(schoolId),
    ).all(),

    db.orm.public.FeeCategory.where((item) => item.schoolId.eq(schoolId))
      .where((item) => item.isActive.eq(true))
      .all(),
  ]);

  const sessionIds = sessions.map((item) => item.id);
  const activeCategoryIds = categories.map((item) => item.id);

  const [terms, structures] = await Promise.all([
    sessionIds.length > 0
      ? db.orm.public.Term.where((item) => item.sessionId.in(sessionIds)).all()
      : Promise.resolve([]),

    sessionIds.length > 0 && activeCategoryIds.length > 0
      ? db.orm.public.FeeStructure.where((item) => item.schoolId.eq(schoolId))
          .where((item) => item.sessionId.in(sessionIds))
          .where((item) => item.categoryId.in(activeCategoryIds))
          .where((item) => item.isActive.eq(true))
          .all()
      : Promise.resolve([]),
  ]);

  const sessionIdSet = new Set(sessionIds);
  const classIds = new Set(classes.map((item) => item.id));
  const categoryIds = new Set(activeCategoryIds);

  return {
    students: students
      .filter((item) => item.isActive && item.classId !== null)
      .filter((item) => classIds.has(item.classId!))
      .sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(
          `${b.lastName} ${b.firstName}`,
        ),
      )
      .map((item) => ({
        id: item.id,
        admissionNumber: item.admissionNumber,
        firstName: item.firstName,
        middleName: item.middleName,
        lastName: item.lastName,
        classId: item.classId,
      })),

    classes: classes.sort((a, b) => a.name.localeCompare(b.name)),
    sessions: sessions.sort((a, b) => b.name.localeCompare(a.name)),
    terms: terms.filter((item) => sessionIdSet.has(item.sessionId)),
    categories,

    structures: structures
      .filter(
        (item) =>
          item.isActive &&
          categoryIds.has(item.categoryId) &&
          sessionIdSet.has(item.sessionId),
      )
      .map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        classId: item.classId,
        sessionId: item.sessionId,
        termId: item.termId,
        amount: String(item.amount),
        isMandatory: item.isMandatory,
      })),
  };
}

export async function getStudentInvoices(schoolId: number) {
  const [invoices, students, sessions] = await Promise.all([
    db.orm.public.StudentInvoice.where((item) =>
      item.schoolId.eq(schoolId),
    ).all(),

    db.orm.public.Student.where((item) => item.schoolId.eq(schoolId)).all(),

    db.orm.public.AcademicSession.where((item) =>
      item.schoolId.eq(schoolId),
    ).all(),
  ]);

  const invoiceIds = invoices.map((invoice) => invoice.id);
  const sessionIds = sessions.map((session) => session.id);

  const [terms, items, allPayments] = await Promise.all([
    sessionIds.length > 0
      ? db.orm.public.Term.where((item) => item.sessionId.in(sessionIds)).all()
      : Promise.resolve([]),

    invoiceIds.length > 0
      ? db.orm.public.InvoiceItem.where((item) =>
          item.invoiceId.in(invoiceIds),
        ).all()
      : Promise.resolve([]),

    invoiceIds.length > 0
      ? db.orm.public.FeePayment.where((item) =>
          item.invoiceId.in(invoiceIds),
        ).all()
      : Promise.resolve([]),
  ]);

  const recordedByUserIds = [
    ...new Set(
      allPayments.flatMap((payment) =>
        payment.recordedByUserId !== null ? [payment.recordedByUserId] : [],
      ),
    ),
  ];

  const allUsers =
    recordedByUserIds.length > 0
      ? await db.orm.public.User.where((item) =>
          item.id.in(recordedByUserIds),
        ).all()
      : [];

  const schoolInvoiceIds = new Set(invoiceIds);

  const payments = allPayments.filter((payment) =>
    schoolInvoiceIds.has(payment.invoiceId),
  );

  const studentMap = new Map(students.map((item) => [item.id, item]));
  const sessionMap = new Map(sessions.map((item) => [item.id, item]));
  const termMap = new Map(terms.map((item) => [item.id, item]));
  const userMap = new Map(allUsers.map((item) => [item.id, item]));

  const itemsByInvoice = new Map<number, typeof items>();

  for (const item of items) {
    if (!schoolInvoiceIds.has(item.invoiceId)) continue;

    const invoiceItems = itemsByInvoice.get(item.invoiceId) ?? [];
    invoiceItems.push(item);
    itemsByInvoice.set(item.invoiceId, invoiceItems);
  }

  const paymentsByInvoice = new Map<number, typeof payments>();

  for (const payment of payments) {
    const invoicePayments = paymentsByInvoice.get(payment.invoiceId) ?? [];
    invoicePayments.push(payment);
    paymentsByInvoice.set(payment.invoiceId, invoicePayments);
  }

  return invoices
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((invoice) => {
      const student = studentMap.get(invoice.studentId);
      const session = sessionMap.get(invoice.sessionId);
      const term = termMap.get(invoice.termId);
      const invoicePayments = paymentsByInvoice.get(invoice.id) ?? [];

      const totalKobo = Math.round(Number(invoice.totalAmount) * 100);

      const paidKobo = invoicePayments
        .filter((payment) => payment.status === "CONFIRMED")
        .reduce(
          (total, payment) => total + Math.round(Number(payment.amount) * 100),
          0,
        );

      return {
        ...invoice,

        student: student
          ? {
              id: student.id,
              admissionNumber: student.admissionNumber,
              firstName: student.firstName,
              lastName: student.lastName,
            }
          : null,

        sessionName: session?.name ?? "Unknown session",
        termName: term?.name ?? "Unknown term",

        items: itemsByInvoice.get(invoice.id) ?? [],

        amountPaid: (paidKobo / 100).toFixed(2),

        outstandingBalance: (Math.max(0, totalKobo - paidKobo) / 100).toFixed(
          2,
        ),

        payments: [...invoicePayments]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((payment) => ({
            ...payment,
            recordedByName:
              (payment.recordedByUserId !== null
                ? userMap.get(payment.recordedByUserId)?.name
                : null) ?? "Unknown staff member",
          })),
      };
    });
}

export async function createTermInvoice(input: CreateTermInvoiceData) {
  const { schoolId, studentId, sessionId, termId, dueDate } = input;

  const [student, session, term] = await Promise.all([
    db.orm.public.Student.where((item) => item.id.eq(studentId)).first(),

    db.orm.public.AcademicSession.where((item) =>
      item.id.eq(sessionId),
    ).first(),

    db.orm.public.Term.where((item) => item.id.eq(termId)).first(),
  ]);

  if (!student || student.schoolId !== schoolId || !student.isActive) {
    throw new Error("Select an active student belonging to your school.");
  }

  if (student.classId === null) {
    throw new Error("The selected student is not assigned to a class.");
  }

  if (!session || session.schoolId !== schoolId) {
    throw new Error("Select an academic session belonging to your school.");
  }

  if (!term || term.sessionId !== sessionId) {
    throw new Error("Select a term belonging to the selected session.");
  }

  const [structures, categories, existingTermInvoice] = await Promise.all([
    db.orm.public.FeeStructure.where((item) => item.schoolId.eq(schoolId))
      .where((item) => item.classId.eq(student.classId!))
      .where((item) => item.sessionId.eq(sessionId))
      .where((item) => item.termId.eq(termId))
      .where((item) => item.isActive.eq(true))
      .all(),

    db.orm.public.FeeCategory.where((item) => item.schoolId.eq(schoolId))
      .where((item) => item.isActive.eq(true))
      .all(),

    db.orm.public.StudentInvoice.where({
      schoolId,
      studentId,
      sessionId,
      termId,
      type: "TERM",
    }).first(),
  ]);

  const termInvoiceKey = `${schoolId}:${studentId}:${sessionId}:${termId}`;

  if (existingTermInvoice) {
    throw new Error(
      "A term invoice already exists for this student, session, and term.",
    );
  }

  const activeCategoryIds = new Set(categories.map((item) => item.id));

  const applicableStructures = structures.filter(
    (item) =>
      item.isActive &&
      item.classId === student.classId &&
      item.sessionId === sessionId &&
      item.termId === termId &&
      activeCategoryIds.has(item.categoryId),
  );

  if (applicableStructures.length === 0) {
    throw new Error(
      "No active fee structures exist for this student's class, session, and term.",
    );
  }

  const categoryMap = new Map(
    categories.map((category) => [category.id, category]),
  );

  const lineItems = applicableStructures.map((structure) => {
    const category = categoryMap.get(structure.categoryId);

    if (!category) {
      throw new Error("A fee category could not be found.");
    }

    const amount = String(structure.amount);
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new Error(`The amount for ${category.name} is invalid.`);
    }

    return {
      categoryId: category.id,
      description: category.name,
      amount,
      numericAmount,
    };
  });

  const totalAmount = lineItems.reduce(
    (total, item) => total + item.numericAmount,
    0,
  );

  const invoiceNumber = `INV-${Date.now()}-${randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;

  return db.transaction(async (tx) => {
    const invoice = await tx.orm.public.StudentInvoice.create({
      schoolId,
      studentId,
      sessionId,
      termId,
      invoiceNumber,
      type: "TERM",
      status: "ISSUED",
      title: `Term fees - ${term.name}`,
      issuedAt: new Date().toISOString(),
      dueDate: dueDate
        ? globalThis.Temporal.Instant.from(`${dueDate}T00:00:00Z`)
        : null,
      totalAmount: totalAmount.toFixed(2),
      termInvoiceKey,
    });

    for (const item of lineItems) {
      await tx.orm.public.InvoiceItem.create({
        invoiceId: invoice.id,
        categoryId: item.categoryId,
        description: item.description,
        quantity: 1,
        amount: item.amount,
      });
    }

    return {
      ...invoice,
      items: lineItems.map((item) => ({
        categoryId: item.categoryId,
        description: item.description,
        quantity: 1,
        amount: item.amount,
      })),
    };
  });
}

type CreateFeePaymentData = CreateFeePaymentInput & {
  schoolId: number;
  recordedByUserId: number;
};

export async function createFeePayment(input: CreateFeePaymentData) {
  const { schoolId, invoiceId, amount, method, notes, recordedByUserId } =
    input;

  const amountKobo = Math.round(amount * 100);

  if (
    !Number.isSafeInteger(amountKobo) ||
    amountKobo <= 0 ||
    Math.abs(amount * 100 - amountKobo) > 0.000001
  ) {
    throw new Error(
      "Enter a valid payment amount with no more than two decimal places.",
    );
  }

  return db.transaction(async (tx) => {
    const invoice = await tx.orm.public.StudentInvoice.where({
      id: invoiceId,
      schoolId,
    }).first();

    if (!invoice) {
      throw new Error("Invoice not found for this school.");
    }

    if (invoice.status !== "ISSUED") {
      throw new Error("Payments can only be recorded against issued invoices.");
    }

    await tx.orm.public.StudentInvoice.where({
      id: invoiceId,
      schoolId,
    }).update({ status: invoice.status });

    const lockedInvoice = await tx.orm.public.StudentInvoice.where({
      id: invoiceId,
      schoolId,
    }).first();

    if (!lockedInvoice || lockedInvoice.status !== "ISSUED") {
      throw new Error("This invoice is no longer available for payment.");
    }

    
const confirmedPayments = await tx.orm.public.FeePayment.where((item) =>
  item.invoiceId.eq(invoiceId),
)
  .where((item) => item.status.eq("CONFIRMED"))
  .all();

const confirmedKobo = confirmedPayments.reduce(
  (total, payment) => total + Math.round(Number(payment.amount) * 100),
  0,
);


    const totalKobo = Math.round(Number(lockedInvoice.totalAmount) * 100);
    const outstandingKobo = totalKobo - confirmedKobo;

    if (outstandingKobo <= 0) {
      throw new Error("This invoice has already been paid in full.");
    }

    if (amountKobo > outstandingKobo) {
      throw new Error(
        `Payment exceeds the outstanding balance of ${(outstandingKobo / 100).toFixed(2)}.`,
      );
    }

    const reference = `PAY-${randomUUID().toUpperCase()}`;

    const payment = await tx.orm.public.FeePayment.create({
      invoiceId,
      amount: (amountKobo / 100).toFixed(2),
      method,
      status: "CONFIRMED",
      reference,
      providerReference: null,
      paidAt: new Date().toISOString(),
      notes: notes?.trim() || null,
      recordedByUserId,
    });

    return {
      ...payment,
      invoiceNumber: lockedInvoice.invoiceNumber,
      invoiceTotal: (totalKobo / 100).toFixed(2),
      amountPaid: ((confirmedKobo + amountKobo) / 100).toFixed(2),
      outstandingBalance: (
        (totalKobo - confirmedKobo - amountKobo) /
        100
      ).toFixed(2),
    };
  });
}

export async function getFeePaymentReceipt(
  schoolId: number,
  paymentId: number,
) {
  const payment = await db.orm.public.FeePayment.where((item) =>
    item.id.eq(paymentId),
  ).first();

  if (!payment) {
    throw new Error("Payment not found.");
  }

  const invoice = await db.orm.public.StudentInvoice.where((item) =>
    item.id.eq(payment.invoiceId),
  ).first();

  if (!invoice || invoice.schoolId !== schoolId) {
    throw new Error("Payment not found for this school.");
  }

  if (payment.status !== "CONFIRMED") {
    throw new Error("Only confirmed payments can have receipts.");
  }

  const [school, student, session, term, invoicePayments, recordedBy] =
    await Promise.all([
      db.orm.public.School.where((item) => item.id.eq(schoolId)).first(),

      db.orm.public.Student.where((item) =>
        item.id.eq(invoice.studentId),
      ).first(),

      db.orm.public.AcademicSession.where((item) =>
        item.id.eq(invoice.sessionId),
      ).first(),

      db.orm.public.Term.where((item) => item.id.eq(invoice.termId)).first(),

      db.orm.public.FeePayment.where((item) =>
        item.invoiceId.eq(invoice.id),
      ).all(),

      payment.recordedByUserId !== null
        ? db.orm.public.User.where((item) =>
            item.id.eq(payment.recordedByUserId!),
          ).first()
        : Promise.resolve(null),
    ]);

  if (!school || !student || student.schoolId !== schoolId) {
    throw new Error("Receipt details could not be found.");
  }

  const comparePayments = (
    a: (typeof invoicePayments)[number],
    b: (typeof invoicePayments)[number],
  ) => {
    const dateComparison = a.createdAt.localeCompare(b.createdAt);
    return dateComparison !== 0 ? dateComparison : a.id - b.id;
  };

  const confirmedPayments = invoicePayments
    .filter((item) => item.status === "CONFIRMED")
    .sort(comparePayments);

  const paymentIndex = confirmedPayments.findIndex(
    (item) => item.id === payment.id,
  );

  if (paymentIndex === -1) {
    throw new Error("Confirmed payment could not be verified.");
  }

  const previousPaidKobo = confirmedPayments
    .slice(0, paymentIndex)
    .reduce((total, item) => total + Math.round(Number(item.amount) * 100), 0);

  const totalKobo = Math.round(Number(invoice.totalAmount) * 100);
  const currentPaymentKobo = Math.round(Number(payment.amount) * 100);

  return {
    school: {
      name: school.name,
      email: school.email,
      phone: school.phone,
      address: school.address,
      city: school.city,
      state: school.state,
      country: school.country,
      logoUrl: school.logoUrl,
      motto: school.motto,
      website: school.website,
    },

    student: {
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
    },

    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      title: invoice.title,
      totalAmount: (totalKobo / 100).toFixed(2),
      sessionName: session?.name ?? "Unknown session",
      termName: term?.name ?? "Unknown term",
    },

    payment: {
      id: payment.id,
      receiptNumber: payment.reference,
      reference: payment.reference,
      amount: (currentPaymentKobo / 100).toFixed(2),
      method: payment.method,
      status: payment.status,
      paidAt: payment.paidAt,
      notes: payment.notes,
      createdAt: payment.createdAt,
      recordedByName: recordedBy?.name ?? "Unknown staff member",
      previousBalance: (
        Math.max(0, totalKobo - previousPaidKobo) / 100
      ).toFixed(2),
      remainingBalance: (
        Math.max(0, totalKobo - previousPaidKobo - currentPaymentKobo) / 100
      ).toFixed(2),
    },
  };
}
