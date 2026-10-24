"use server";

import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { calculateClassTermResults } from "@/lib/services/result-calculation.service";
import { db } from "@/prisma/db";

import { notifyParentsOfPublishedReports } from "@/lib/services/report-publication-notification.service";


function parsePositiveId(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

function redirectWithMessage(params: {
  reportType: string;
  sessionId: number;
  classId: number;
  termId: number;
  status: "success" | "error";
  message: string;
}): never {
  const searchParams = new URLSearchParams({
    reportType: params.reportType,
    sessionId: String(params.sessionId),
    classId: String(params.classId),
    termId: String(params.termId),
    status: params.status,
    message: params.message,
  });

  redirect(`/school/results/view?${searchParams.toString()}`);
}

export async function generateResultsAction(formData: FormData) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const reportType = formData.get("reportType");
  const sessionId = parsePositiveId(formData.get("sessionId"));
  const classId = parsePositiveId(formData.get("classId"));
  const termId = parsePositiveId(formData.get("termId"));

  if (
    typeof reportType !== "string" ||
    !["MID_TERM", "TERMINAL"].includes(reportType) ||
    !sessionId ||
    !classId ||
    !termId
  ) {
    throw new Error("Invalid result generation request.");
  }

  let status: "success" | "error" = "success";
  let message = "Results generated successfully.";

  try {
    const generationResult = await calculateClassTermResults({
      schoolId,
      classId,
      termId,
      reportType: reportType as "MID_TERM" | "TERMINAL",
    });

    const generatedCount = generationResult.results.length;
    const pendingCount = generationResult.pendingStudents.length;

    if (generatedCount === 0 && pendingCount > 0) {
      status = "error";

      message = `No results were generated. ${pendingCount} student(s) still have incomplete subject results.`;
    } else if (pendingCount > 0) {
      message = `Results generated successfully for ${generatedCount} student(s). ${pendingCount} student(s) remain pending because their subject results are incomplete.`;
    } else {
      message = `Results generated successfully for ${generatedCount} student(s).`;
    }
  } catch (error) {
    status = "error";

    message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while generating results.";
  }

  redirectWithMessage({
    reportType,
    sessionId,
    classId,
    termId,
    status,
    message,
  });
}


type PublicationReportType = "MID_TERM" | "TERMINAL";

async function validatePublicationRequest(formData: FormData) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;
  const userId = Number(session.user.id);

  const reportType = formData.get("reportType");
  const sessionId = parsePositiveId(formData.get("sessionId"));
  const classId = parsePositiveId(formData.get("classId"));
  const termId = parsePositiveId(formData.get("termId"));

  if (
    !schoolId ||
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    typeof reportType !== "string" ||
    !["MID_TERM", "TERMINAL"].includes(reportType) ||
    !sessionId ||
    !classId ||
    !termId
  ) {
    throw new Error("Invalid report publication request.");
  }

  const [academicSession, schoolClass, term] = await Promise.all([
    db.orm.public.AcademicSession.where({
      id: sessionId,
      schoolId,
    }).first(),
    db.orm.public.SchoolClass.where({
      id: classId,
      schoolId,
    }).first(),
    db.orm.public.Term.where({
      id: termId,
      sessionId,
    }).first(),
  ]);

  if (!academicSession || !schoolClass || !term) {
    throw new Error("The selected class, session, or term is invalid.");
  }

  const existingResult = await db.orm.public.StudentTermResult.where({
    schoolId,
    classId,
    termId,
    reportType: reportType as "MID_TERM" | "TERMINAL",
  }).first();

  return {
    schoolId,
    userId,
    sessionId,
    classId,
    termId,
    reportType: reportType as PublicationReportType,
    hasResults: Boolean(existingResult),
  };
}

export async function publishReportsAction(formData: FormData) {
  const data = await validatePublicationRequest(formData);

  if (!data.hasResults) {
    redirectWithMessage({
      reportType: data.reportType,
      sessionId: data.sessionId,
      classId: data.classId,
      termId: data.termId,
      status: "error",
      message: "Generate results before publishing reports.",
    });
  }

  try {
    const existing = await db.orm.public.ReportPublication.where({
      schoolId: data.schoolId,
      classId: data.classId,
      termId: data.termId,
      reportType: data.reportType,
    }).first();

    const wasAlreadyPublished = existing?.isPublished === true;

    const now = new Date().toISOString();

    if (existing) {
      await db.orm.public.ReportPublication.where({
        id: existing.id,
        schoolId: data.schoolId,
      }).update({
        isPublished: true,
        publishedAt: now,
        publishedByUserId: data.userId,
        unpublishedAt: null,
        unpublishedByUserId: null,
      });
    } else {
      await db.orm.public.ReportPublication.create({
        schoolId: data.schoolId,
        classId: data.classId,
        termId: data.termId,
        reportType: data.reportType,
        isPublished: true,
        publishedAt: now,
        publishedByUserId: data.userId,
        unpublishedAt: null,
        unpublishedByUserId: null,
      });
    }

    
if (!wasAlreadyPublished) {
  try {
    const result = await notifyParentsOfPublishedReports({
      schoolId: data.schoolId,
      createdByUserId: data.userId,
      classId: data.classId,
      termId: data.termId,
      reportType: data.reportType,
    });

    console.info("Report publication notifications processed.", {
      schoolId: data.schoolId,
      classId: data.classId,
      termId: data.termId,
      reportType: data.reportType,
      recipientCount: result.recipientCount,
      skipped: result.skipped,
    });
  } catch (notificationError) {
    console.error(
      "Reports were published, but parent notifications could not be created.",
      notificationError,
    );
  }
}

    redirectWithMessage({
      reportType: data.reportType,
      sessionId: data.sessionId,
      classId: data.classId,
      termId: data.termId,
      status: "success",
      message: "Reports published successfully.",
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    redirectWithMessage({
      reportType: data.reportType,
      sessionId: data.sessionId,
      classId: data.classId,
      termId: data.termId,
      status: "error",
      message: "Unable to publish reports. Please try again.",
    });
  }
}

export async function unpublishReportsAction(formData: FormData) {
  const data = await validatePublicationRequest(formData);

  try {
    const existing = await db.orm.public.ReportPublication.where({
      schoolId: data.schoolId,
      classId: data.classId,
      termId: data.termId,
      reportType: data.reportType,
    }).first();

    if (!existing || !existing.isPublished) {
      redirectWithMessage({
        reportType: data.reportType,
        sessionId: data.sessionId,
        classId: data.classId,
        termId: data.termId,
        status: "error",
        message: "These reports are not currently published.",
      });
    }

    await db.orm.public.ReportPublication.where({
      id: existing.id,
      schoolId: data.schoolId,
      isPublished: true,
    }).update({
      isPublished: false,
      unpublishedAt: new Date().toISOString(),
      unpublishedByUserId: data.userId,
    });

    redirectWithMessage({
      reportType: data.reportType,
      sessionId: data.sessionId,
      classId: data.classId,
      termId: data.termId,
      status: "success",
      message: "Reports unpublished successfully.",
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    redirectWithMessage({
      reportType: data.reportType,
      sessionId: data.sessionId,
      classId: data.classId,
      termId: data.termId,
      status: "error",
      message: "Unable to unpublish reports. Please try again.",
    });
  }
}
