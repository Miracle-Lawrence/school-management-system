"use server";

import { requireRole } from "@/lib/auth/authorization";
import {
  createStudentLogin,
  resetStudentPassword,
} from "@/lib/services/student-account.service";

export type StudentAccountActionState = {
  error?: string;
  loginEmail?: string;
  temporaryPassword?: string;
};

function readPassword(formData: FormData): string | null {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof password !== "string" || password.length !== 4) {
    return null;
  }

  if (password.trim().length === 0 || password !== confirmPassword) {
    return null;
  }

  return password;
}

export async function createStudentLoginAction(
  _previousState: StudentAccountActionState,
  formData: FormData,
): Promise<StudentAccountActionState> {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    return { error: "School context is required." };
  }

  const studentId = Number(formData.get("studentId"));
  const password = readPassword(formData);

  if (!Number.isSafeInteger(studentId) || studentId <= 0) {
    return { error: "Invalid student account." };
  }

  if (password === null) {
    return {
      error: "Enter a password of exactly 4 characters and confirm it correctly.",
    };
  }

  try {
    return await createStudentLogin(schoolId, studentId, password);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to create the student login.",
    };
  }
}

export async function resetStudentPasswordAction(
  _previousState: StudentAccountActionState,
  formData: FormData,
): Promise<StudentAccountActionState> {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    return { error: "School context is required." };
  }

  const studentId = Number(formData.get("studentId"));
  const password = readPassword(formData);

  if (!Number.isSafeInteger(studentId) || studentId <= 0) {
    return { error: "Invalid student account." };
  }

  if (password === null) {
    return {
      error: "Enter a password of exactly 4 characters and confirm it correctly.",
    };
  }

  try {
    return await resetStudentPassword(schoolId, studentId, password);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to reset the student password.",
    };
  }
}
