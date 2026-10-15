"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import {
  getReportComponent,
  updateReportComponent,
} from "@/lib/services/report-configuration.service";

export interface UpdateComponentFormState {
  error: string | null;
}

const allowedAssessmentTypes = [
  "ASSIGNMENT",
  "TEST",
  "CA",
  "EXAM",
  "PROJECT",
  "PRACTICAL",
  "OTHER",
] as const;

type AssessmentType = (typeof allowedAssessmentTypes)[number];

export async function updateReportComponentAction(
  configurationId: number,
  componentId: number,
  previousState: UpdateComponentFormState,
  formData: FormData,
): Promise<UpdateComponentFormState> {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    return { error: "School context is required." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const displayOrder = Number(formData.get("displayOrder"));
  const isRequired = formData.get("isRequired") === "on";
  const isVisible = formData.get("isVisible") === "on";

  if (!name) {
    return { error: "Component name is required." };
  }

  if (name.length > 100) {
    return {
      error: "Component name cannot exceed 100 characters.",
    };
  }

  if (!Number.isInteger(displayOrder) || displayOrder < 1) {
    return {
      error: "Display order must be a positive whole number.",
    };
  }

  try {
    const component = await getReportComponent(schoolId, componentId);

    if (component.configurationId !== configurationId) {
      return { error: "Invalid report component." };
    }

    if (component.type === "CALCULATED") {
      await updateReportComponent(schoolId, componentId, {
        name,
        displayOrder,
        isRequired,
        isVisible,
      });
    } else if (component.type === "ASSESSMENT") {
      const assessmentTypeRaw = String(formData.get("assessmentType") ?? "");

      if (
        !allowedAssessmentTypes.includes(assessmentTypeRaw as AssessmentType)
      ) {
        return { error: "Select a valid assessment type." };
      }

      const assessmentType = assessmentTypeRaw as AssessmentType;

      const maxScore = Number(formData.get("maxScore"));

      if (!Number.isFinite(maxScore) || maxScore <= 0) {
        return {
          error: "Maximum score must be greater than zero.",
        };
      }

      const hasCategoryField = formData.has("assessmentCategoryId");

      const categoryRaw = String(
        formData.get("assessmentCategoryId") ?? "",
      ).trim();

      // Missing field: preserve the existing category.
      // Blank field: explicitly remove the category.
      // Numeric value: assign the selected category.
      let assessmentCategoryId: number | null | undefined;

      if (!hasCategoryField) {
        assessmentCategoryId = undefined;
      } else if (!categoryRaw) {
        assessmentCategoryId = null;
      } else {
        const parsedCategoryId = Number(categoryRaw);

        if (!Number.isInteger(parsedCategoryId) || parsedCategoryId < 1) {
          return {
            error: "Select a valid assessment category.",
          };
        }

        assessmentCategoryId = parsedCategoryId;
      }

      await updateReportComponent(schoolId, componentId, {
        name,
        assessmentType,
        assessmentCategoryId,
        maxScore,
        displayOrder,
        isRequired,
        isVisible,
      });
    } else {
      return { error: "Unsupported report component type." };
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

    if (error instanceof Error) {
      return { error: error.message };
    }

    return {
      error: "Unable to update the component. Please try again.",
    };
  }

  redirect(`/school/report-settings/${configurationId}`);
}
