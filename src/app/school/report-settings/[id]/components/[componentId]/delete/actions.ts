"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { deleteReportComponent } from "@/lib/services/report-configuration.service";

export interface DeleteComponentFormState {
  error: string | null;
}

export async function deleteReportComponentAction(
  configurationId: number,
  componentId: number,
  previousState: DeleteComponentFormState,
  formData: FormData,
): Promise<DeleteComponentFormState> {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    return {
      error: "School context is required.",
    };
  }

  const confirmation = String(formData.get("confirmation") ?? "");

  if (confirmation !== "DELETE") {
    return {
      error: "Please confirm the deletion before continuing.",
    };
  }

  try {
    await deleteReportComponent(schoolId, componentId);
  } catch (error) {
    if (error instanceof Error) {
      return {
        error: error.message,
      };
    }

    return {
      error: "An unexpected error occurred while deleting the component.",
    };
  }

  revalidatePath(`/school/report-settings/${configurationId}`);

  redirect(`/school/report-settings/${configurationId}`);
}
