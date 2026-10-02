"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { createReportComponent } from "@/lib/services/report-configuration.service";

export interface ComponentFormState {
  error: string | null;
}

export async function createReportComponentAction(
  configurationId: number,
  previousState: ComponentFormState,
  formData: FormData,
): Promise<ComponentFormState> {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    return { error: "School context is required." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "ASSESSMENT");
  const aggregationType = String(formData.get("aggregationType") ?? "SUM");

  const displayOrder = Number(formData.get("displayOrder"));

  const isRequired = formData.get("isRequired") === "on";
  const isVisible = formData.get("isVisible") === "on";

  if (!name) {
    return { error: "Component name is required." };
  }

  if (!Number.isInteger(configurationId) || configurationId < 1) {
    return { error: "Invalid report configuration." };
  }

  if (!Number.isInteger(displayOrder) || displayOrder < 1) {
    return {
      error: "Display order must be a positive whole number.",
    };
  }

  if (type !== "ASSESSMENT" && type !== "CALCULATED") {
    return { error: "Select a valid component type." };
  }

  const allowedAggregationTypes = ["SUM", "AVERAGE"] as const;

  if (
    !allowedAggregationTypes.includes(
      aggregationType as (typeof allowedAggregationTypes)[number],
    )
  ) {
    return { error: "Select a valid aggregation type." };
  }

  try {
    if (type === "ASSESSMENT") {
      const assessmentType = String(formData.get("assessmentType") ?? "");

      const maxScore = Number(formData.get("maxScore"));

      const allowedAssessmentTypes = [
        "ASSIGNMENT",
        "TEST",
        "CA",
        "EXAM",
        "PROJECT",
        "PRACTICAL",
        "OTHER",
      ] as const;

      if (
        !allowedAssessmentTypes.includes(
          assessmentType as (typeof allowedAssessmentTypes)[number],
        )
      ) {
        return { error: "Select a valid assessment type." };
      }

      if (!Number.isFinite(maxScore) || maxScore <= 0) {
        return {
          error: "Maximum score must be greater than zero.",
        };
      }

      await createReportComponent(schoolId, {
        configurationId,
        name,
        type: "ASSESSMENT",
        assessmentType:
          assessmentType as (typeof allowedAssessmentTypes)[number],
        aggregationType:
          aggregationType as (typeof allowedAggregationTypes)[number],
        maxScore,
        displayOrder,
        isRequired,
        isVisible,
      });
    } else {
      await createReportComponent(schoolId, {
        configurationId,
        name,
        type: "CALCULATED",
        aggregationType:
          aggregationType as (typeof allowedAggregationTypes)[number],
        displayOrder,
        isRequired,
        isVisible,
      });
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "A report component with this name already exists in this configuration."
    ) {
      return {
        error: `A component named "${name}" already exists in this report configuration. Please choose a different name.`,
      };
    }

    return {
      error: "Unable to save the component. Please try again.",
    };
  }

  redirect(`/school/report-settings/${configurationId}`);
}
