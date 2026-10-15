"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/authorization";
import { updateReportConfiguration } from "@/lib/services/report-configuration.service";

const updateSchema = z.object({
  name: z.string().trim().min(1, "Configuration name is required."),
  gradeScaleSetId: z
    .number()
    .int("Please select a valid grading set.")
    .positive("Please select a valid grading set."),
  isActive: z.boolean(),
  showClassPosition: z.boolean(),
  showClassTeacherName: z.boolean(),
  showPrincipalSignature: z.boolean(),
  showSchoolStamp: z.boolean(),
  showAttendance: z.boolean(),
});

export async function updateReportConfigurationAction(
  configurationId: number,
  formData: FormData,
): Promise<void> {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const rawGradeScaleSetId = String(
    formData.get("gradeScaleSetId") ?? "",
  ).trim();

  const gradeScaleSetId = Number(rawGradeScaleSetId);

  const parsed = updateSchema.safeParse({
    name: formData.get("name"),
    gradeScaleSetId:
      rawGradeScaleSetId !== "" && Number.isInteger(gradeScaleSetId)
        ? gradeScaleSetId
        : undefined,
    isActive: formData.get("isActive") === "on",
    showClassPosition: formData.get("showClassPosition") === "on",
    showClassTeacherName: formData.get("showClassTeacherName") === "on",
    showPrincipalSignature: formData.get("showPrincipalSignature") === "on",
    showSchoolStamp: formData.get("showSchoolStamp") === "on",
    showAttendance: formData.get("showAttendance") === "on",
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid configuration details.",
    );
  }

  await updateReportConfiguration(schoolId, configurationId, parsed.data);

  redirect("/school/report-settings");
}
