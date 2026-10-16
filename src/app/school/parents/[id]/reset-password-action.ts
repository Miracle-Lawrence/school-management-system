"use server";

import { requireRole } from "@/lib/auth/authorization";
import { resetParentPassword } from "@/lib/services/parent-password.service";

type ResetPasswordState = {
  error?: string;
  temporaryPassword?: string;
};

export async function resetParentPasswordAction(
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    return { error: "School context is required." };
  }

  const parentId = Number(formData.get("parentId"));

  if (!Number.isSafeInteger(parentId) || parentId <= 0) {
    return { error: "Invalid parent account." };
  }

  try {
    const temporaryPassword = await resetParentPassword(
      schoolId,
      parentId,
    );

    return { temporaryPassword };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to reset this parent password.",
    };
  }
}
