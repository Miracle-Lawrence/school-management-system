import { db } from "@/prisma/db";

type FeeReminderResult = {
  invoicesChecked: number;
  remindersCreated: number;
  parentsNotified: number;
  skippedInvoices: number;
};

type InvoiceReminder = {
  invoiceId: number;
  parentUserIds: number[];
  title: string;
  message: string;
};

export async function sendOutstandingFeeReminders(
  schoolId: number,
  createdByUserId: number,
): Promise<FeeReminderResult> {
  const [school, creator, invoices, students, parents] = await Promise.all([
    db.orm.public.School.where({ id: schoolId }).first(),

    db.orm.public.User.where({
      id: createdByUserId,
      schoolId,
    }).first(),

    db.orm.public.StudentInvoice.where((invoice) =>
      invoice.schoolId.eq(schoolId),
    ).all(),

    db.orm.public.Student.where((student) =>
      student.schoolId.eq(schoolId),
    ).all(),

    db.orm.public.Parent.where((parent) => parent.schoolId.eq(schoolId)).all(),
  ]);

  if (!school) {
    throw new Error("School not found.");
  }

  if (
    !creator ||
    !creator.isActive ||
    creator.mustChangePassword ||
    !["SCHOOL_OWNER", "SCHOOL_ADMIN"].includes(creator.role)
  ) {
    throw new Error("You are not authorized to send fee reminders.");
  }

  const issuedInvoices = invoices.filter(
    (invoice) => invoice.status === "ISSUED",
  );

  const studentMap = new Map(students.map((student) => [student.id, student]));

  const invoiceIds = issuedInvoices.map((invoice) => invoice.id);
  const studentIds = students.map((student) => student.id);
  const parentIds = parents.map((parent) => parent.id);

  const [payments, parentStudentLinks, existingNotifications] =
    await Promise.all([
      invoiceIds.length > 0
        ? db.orm.public.FeePayment.where((payment) =>
            payment.invoiceId.in(invoiceIds),
          ).all()
        : Promise.resolve([]),

      parentIds.length > 0 && studentIds.length > 0
        ? db.orm.public.ParentStudent.where((link) =>
            link.parentId.in(parentIds),
          )
            .where((link) => link.studentId.in(studentIds))
            .all()
        : Promise.resolve([]),

      db.orm.public.Notification.where((notification) =>
        notification.schoolId.eq(schoolId),
      )
        .where((notification) => notification.category.eq("FEE_REMINDER"))
        .where((notification) => notification.status.eq("SENT"))
        .all(),
    ]);

  const alreadyRemindedInvoiceIds = new Set(
    existingNotifications
      .filter((notification) => notification.invoiceId !== null)
      .map((notification) => notification.invoiceId as number),
  );

  const paymentsByInvoice = new Map<number, typeof payments>();

  for (const payment of payments) {
    const existing = paymentsByInvoice.get(payment.invoiceId) ?? [];
    existing.push(payment);
    paymentsByInvoice.set(payment.invoiceId, existing);
  }

  const parentIdsByStudent = new Map<number, Set<number>>();

  for (const link of parentStudentLinks) {
    const parent = parents.find((item) => item.id === link.parentId);

    if (!parent || parent.schoolId !== schoolId || parent.userId === null) {
      continue;
    }

    const linkedParentIds =
      parentIdsByStudent.get(link.studentId) ?? new Set<number>();

    linkedParentIds.add(parent.userId);
    parentIdsByStudent.set(link.studentId, linkedParentIds);
  }

  const reminders: InvoiceReminder[] = [];
  let skippedInvoices = 0;

  for (const invoice of issuedInvoices) {
    if (alreadyRemindedInvoiceIds.has(invoice.id)) {
      skippedInvoices++;
      continue;
    }

    const student = studentMap.get(invoice.studentId);

    if (!student || !student.isActive) {
      skippedInvoices++;
      continue;
    }

    const invoicePayments = paymentsByInvoice.get(invoice.id) ?? [];

    const totalKobo = Math.round(Number(invoice.totalAmount) * 100);

    const paidKobo = invoicePayments
      .filter((payment) => payment.status === "CONFIRMED")
      .reduce(
        (total, payment) => total + Math.round(Number(payment.amount) * 100),
        0,
      );

    const outstandingKobo = Math.max(0, totalKobo - paidKobo);

    if (outstandingKobo <= 0) {
      skippedInvoices++;
      continue;
    }

    const linkedParentUserIds = [
      ...(parentIdsByStudent.get(student.id) ?? new Set<number>()),
    ];

    if (linkedParentUserIds.length === 0) {
      skippedInvoices++;
      continue;
    }

    const outstanding = (outstandingKobo / 100).toFixed(2);
    const studentName = `${student.firstName} ${student.lastName}`.trim();

    reminders.push({
      invoiceId: invoice.id,
      parentUserIds: linkedParentUserIds,
      title: "Outstanding school fee reminder",
      message: [
        `This is a reminder about an outstanding school fee for ${studentName}.`,
        `Invoice number: ${invoice.invoiceNumber}.`,
        `Outstanding balance: ₦${outstanding}.`,
        "Please sign in to your parent portal to review the invoice and payment options.",
      ].join("\n"),
    });
  }

  if (reminders.length === 0) {
    return {
      invoicesChecked: issuedInvoices.length,
      remindersCreated: 0,
      parentsNotified: 0,
      skippedInvoices,
    };
  }

  const candidateUserIds = [
    ...new Set(reminders.flatMap((reminder) => reminder.parentUserIds)),
  ];

  const recipientUsers = await db.orm.public.User.where((user) =>
    user.id.in(candidateUserIds),
  ).all();

  const eligibleUserIds = new Set(
    recipientUsers
      .filter(
        (user) =>
          user.schoolId === schoolId &&
          user.role === "PARENT" &&
          user.isActive &&
          !user.mustChangePassword,
      )
      .map((user) => user.id),
  );

  const validReminders = reminders
    .map((reminder) => ({
      ...reminder,
      parentUserIds: reminder.parentUserIds.filter((userId) =>
        eligibleUserIds.has(userId),
      ),
    }))
    .filter((reminder) => reminder.parentUserIds.length > 0);

  const parentsNotified = new Set<number>();
  const sentAt = new Date().toISOString();

  await db.transaction(async (tx) => {
    for (const reminder of validReminders) {
      const notification = await tx.orm.public.Notification.create({
        schoolId,
        createdByUserId,
        invoiceId: reminder.invoiceId,
        title: reminder.title,
        message: reminder.message,
        category: "FEE_REMINDER",
        status: "SENT",
        scheduledAt: null,
        sentAt,
      });

      for (const userId of reminder.parentUserIds) {
        await tx.orm.public.NotificationRecipient.create({
          notificationId: notification.id,
          userId,
          readAt: null,
        });

        parentsNotified.add(userId);
      }
    }
  });

  return {
    invoicesChecked: issuedInvoices.length,
    remindersCreated: validReminders.length,
    parentsNotified: parentsNotified.size,
    skippedInvoices,
  };
}
