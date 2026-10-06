"use server";

import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { calculateClassTermResults } from "@/lib/services/result-calculation.service";

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
