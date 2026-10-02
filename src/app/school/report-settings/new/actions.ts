"use server";

import { requireRole } from "@/lib/auth/authorization";
import { redirect } from "next/navigation";
import { createReportConfiguration } from "@/lib/services/report-configuration.service";

export async function createReportConfigurationAction(formData: FormData) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const reportType = String(formData.get("reportType") ?? "");
  const isActive = formData.get("isActive") === "on";

  if (!name) {
    throw new Error("Configuration name is required.");
  }

  if (reportType !== "MID_TERM" && reportType !== "TERMINAL") {
    throw new Error("Invalid report type.");
  }

  await createReportConfiguration({
    schoolId,
    name,
    reportType,
  });
    redirect("/school/report-settings");
}

