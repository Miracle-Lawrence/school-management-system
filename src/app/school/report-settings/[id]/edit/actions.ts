"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/authorization";
import { updateReportConfiguration } from "@/lib/services/report-configuration.service";

const updateSchema = z.object({
  name: z.string().trim().min(1, "Configuration name is required."),
  isActive: z.boolean(),
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

  const parsed = updateSchema.safeParse({
    name: formData.get("name"),
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid configuration details.",
    );
  }

  await updateReportConfiguration(schoolId, configurationId, parsed.data);

  redirect("/school/report-settings");
}
