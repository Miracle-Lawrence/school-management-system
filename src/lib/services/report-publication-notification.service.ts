import { db } from "@/prisma/db";

type ReportPublicationNotificationInput = {
  schoolId: number;
  createdByUserId: number;
  classId: number;
  termId: number;
  reportType: "MID_TERM" | "TERMINAL";
};

export async function notifyParentsOfPublishedReports(
  input: ReportPublicationNotificationInput,
) {
  const { schoolId, createdByUserId, classId, termId, reportType } = input;

  const [students, parents, publications, matchingResults] = await Promise.all([
    db.orm.public.Student.where((student) => student.schoolId.eq(schoolId))
      .where((student) => student.classId.eq(classId))
      .all(),

    db.orm.public.Parent.where((parent) => parent.schoolId.eq(schoolId)).all(),

    db.orm.public.ReportPublication.where((publication) =>
      publication.schoolId.eq(schoolId),
    ).all(),

    db.orm.public.StudentTermResult.where((result) =>
      result.schoolId.eq(schoolId),
    )
      .where((result) => result.classId.eq(classId))
      .where((result) => result.termId.eq(termId))
      .where((result) => result.reportType.eq(reportType))
      .all(),
  ]);

  const publication = publications.find(
    (item) =>
      item.classId === classId &&
      item.termId === termId &&
      item.reportType === reportType &&
      item.isPublished,
  );

  if (!publication) {
    throw new Error("The report publication could not be verified.");
  }

  const studentIdsWithResults = new Set(
    matchingResults.map((result) => result.studentId),
  );

  const eligibleStudentIds = students
    .filter(
      (student) => student.isActive && studentIdsWithResults.has(student.id),
    )
    .map((student) => student.id);

  if (eligibleStudentIds.length === 0) {
    return {
      recipientCount: 0,
      skipped: "NO_ELIGIBLE_STUDENTS" as const,
    };
  }

  const parentIds = parents.map((parent) => parent.id);

  const links =
    parentIds.length > 0
      ? await db.orm.public.ParentStudent.where((link) =>
          link.parentId.in(parentIds),
        )
          .where((link) => link.studentId.in(eligibleStudentIds))
          .all()
      : [];

  const parentById = new Map(parents.map((parent) => [parent.id, parent]));

  const candidateUserIds = [
    ...new Set(
      links.flatMap((link) => {
        const parent = parentById.get(link.parentId);

        return parent?.userId != null ? [parent.userId] : [];
      }),
    ),
  ];

  const users =
    candidateUserIds.length > 0
      ? await db.orm.public.User.where((user) =>
          user.id.in(candidateUserIds),
        ).all()
      : [];

  const eligibleUserIds = [
    ...new Set(
      users
        .filter(
          (user) =>
            user.schoolId === schoolId &&
            user.role === "PARENT" &&
            user.isActive &&
            !user.mustChangePassword,
        )
        .map((user) => user.id),
    ),
  ];

  if (eligibleUserIds.length === 0) {
    return {
      recipientCount: 0,
      skipped: "NO_ELIGIBLE_PARENTS" as const,
    };
  }

  const className =
    (
      await db.orm.public.SchoolClass.where({
        id: classId,
        schoolId,
      }).first()
    )?.name ?? "your child's class";

  const termName =
    (
      await db.orm.public.Term.where({
        id: termId,
      }).first()
    )?.name ?? "the selected term";

  const reportLabel = reportType === "MID_TERM" ? "Mid-term" : "Terminal";

  const title = "Reports Published";

  const message =
    `${reportLabel} reports for ${className}, ${termName}, are now available. ` +
    "Sign in to your parent portal to view your child's report.";

  const sentAt = new Date().toISOString();

  const notification = await db.transaction(async (tx) => {
    const created = await tx.orm.public.Notification.create({
      schoolId,
      createdByUserId,
      title,
      message,
      category: "REPORT_PUBLISHED",
      status: "DRAFT",
      scheduledAt: null,
      sentAt: null,
    });

    for (const userId of eligibleUserIds) {
      await tx.orm.public.NotificationRecipient.create({
        notificationId: created.id,
        userId,
        readAt: null,
      });
    }

    await tx.orm.public.Notification.where({
      id: created.id,
      schoolId,
    }).update({
      status: "SENT",
      sentAt,
    });

    return created;
  });

  return {
    notificationId: notification.id,
    recipientCount: eligibleUserIds.length,
    skipped: null,
  };
}
