"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/authorization";
import {
  createAssessmentCategory,
  updateAssessmentCategory,
  deactivateAssessmentCategory,
} from "@/lib/services/report-configuration.service";

export interface AssessmentCategoryActionState {
  error: string | null;
  success: string | null;
}

const initialActionState: AssessmentCategoryActionState = {
  error: null,
  success: null,
};

function getRequiredText(formData: FormData, field: string): string {
  return String(formData.get(field) ?? "").trim();
}

function getPositiveInteger(formData: FormData, field: string): number | null {
  const value = getRequiredText(formData, field);

  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

function getCategoryType(formData: FormData): string | null {
  const type = getRequiredText(formData, "type");

  const allowedTypes = [
    "ASSIGNMENT",
    "TEST",
    "CA",
    "EXAM",
    "PROJECT",
    "PRACTICAL",
    "OTHER",
  ];

  return allowedTypes.includes(type) ? type : null;
}

async function getSchoolId(): Promise<number> {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  return schoolId;
}

export async function createAssessmentCategoryAction(
  _previousState: AssessmentCategoryActionState,
  formData: FormData,
): Promise<AssessmentCategoryActionState> {
  try {
    const schoolId = await getSchoolId();
    const name = getRequiredText(formData, "name");
    const type = getCategoryType(formData);
    const displayOrder = getPositiveInteger(formData, "displayOrder");

    if (!name || name.length > 100) {
      return {
        error: "Enter a category name between 1 and 100 characters.",
        success: null,
      };
    }

    if (!type) {
      return {
        error: "Select a valid assessment type.",
        success: null,
      };
    }

    if (displayOrder === null) {
      return {
        error: "Display order must be a positive whole number.",
        success: null,
      };
    }

    await createAssessmentCategory(schoolId, {
      name,
      type: type as
        | "ASSIGNMENT"
        | "TEST"
        | "CA"
        | "EXAM"
        | "PROJECT"
        | "PRACTICAL"
        | "OTHER",
      displayOrder,
    });

    revalidatePath("/school/settings/assessment-categories");

    return {
      error: null,
      success: "Assessment category created successfully.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to create assessment category.",
      success: null,
    };
  }
}

export async function updateAssessmentCategoryAction(
  categoryId: number,
  _previousState: AssessmentCategoryActionState,
  formData: FormData,
): Promise<AssessmentCategoryActionState> {
  try {
    const schoolId = await getSchoolId();
    const name = getRequiredText(formData, "name");
    const type = getCategoryType(formData);
    const displayOrder = getPositiveInteger(formData, "displayOrder");

    if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
      return { error: "Invalid category ID.", success: null };
    }

    if (!name || name.length > 100) {
      return {
        error: "Enter a category name between 1 and 100 characters.",
        success: null,
      };
    }

    if (!type) {
      return {
        error: "Select a valid assessment type.",
        success: null,
      };
    }

    if (displayOrder === null) {
      return {
        error: "Display order must be a positive whole number.",
        success: null,
      };
    }

    await updateAssessmentCategory(schoolId, categoryId, {
      name,
      type: type as
        | "ASSIGNMENT"
        | "TEST"
        | "CA"
        | "EXAM"
        | "PROJECT"
        | "PRACTICAL"
        | "OTHER",
      displayOrder,
    });

    revalidatePath("/school/settings/assessment-categories");

    return {
      error: null,
      success: "Assessment category updated successfully.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to update assessment category.",
      success: null,
    };
  }
}

export async function deactivateAssessmentCategoryAction(
  categoryId: number,
  _previousState: AssessmentCategoryActionState,
  _formData: FormData,
): Promise<AssessmentCategoryActionState> {
  try {
    const schoolId = await getSchoolId();

    if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
      return { error: "Invalid category ID.", success: null };
    }

    await deactivateAssessmentCategory(schoolId, categoryId);

    revalidatePath("/school/settings/assessment-categories");

    return {
      error: null,
      success: "Assessment category deactivated successfully.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to deactivate assessment category.",
      success: null,
    };
  }
}


