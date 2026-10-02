"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";

import {
  addReportComponentRule,
  deleteReportComponentRule,
  getReportComponent,
  updateReportComponentRule,
} from "@/lib/services/report-configuration.service";

export interface ComponentRuleFormState {
  error: string | null;
}

export async function createComponentRuleAction(
  configurationId: number,
  componentId: number,
  previousState: ComponentRuleFormState,
  formData: FormData,
): Promise<ComponentRuleFormState> {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    return { error: "School context is required." };
  }

  const sourceComponentId = Number(formData.get("sourceComponentId"));
  const weight = Number(formData.get("weight"));

  if (!Number.isInteger(sourceComponentId) || sourceComponentId < 1) {
    return { error: "Select a valid source component." };
  }

  if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
    return {
      error: "Weight must be greater than zero and cannot exceed 100%.",
    };
  }

  try {
    const component = await getReportComponent(schoolId, componentId);

    if (component.configurationId !== configurationId) {
      return {
        error: "Component does not belong to this report configuration.",
      };
    }

    if (component.type !== "CALCULATED") {
      return {
        error: "Calculation rules can only be added to calculated components.",
      };
    }

    await addReportComponentRule(schoolId, {
      componentId,
      sourceComponentId,
      weight,
    });
  } catch (error) {
    if (error instanceof Error) {
      const friendlyMessages = [
        "A component cannot use itself as a calculation source.",
        "This source component is already part of the calculation.",
        "Calculation rule weights cannot exceed 100%.",
        "Source component must belong to the same report configuration.",
        "Calculation rules can only be added to calculated components.",
      ];

      if (friendlyMessages.includes(error.message)) {
        return { error: error.message };
      }
    }

    return {
      error: "Unable to add the calculation rule. Please try again.",
    };
  }

  redirect(
    `/school/report-settings/${configurationId}/components/${componentId}/rules`,
  );
}

export async function deleteComponentRuleAction(
  configurationId: number,
  componentId: number,
  ruleId: number,
): Promise<void> {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  if (
    !Number.isInteger(configurationId) ||
    configurationId < 1 ||
    !Number.isInteger(componentId) ||
    componentId < 1 ||
    !Number.isInteger(ruleId) ||
    ruleId < 1
  ) {
    throw new Error("Invalid calculation rule information.");
  }

  const component = await getReportComponent(schoolId, componentId);

  if (component.configurationId !== configurationId) {
    throw new Error("Component does not belong to this report configuration.");
  }

  if (component.type !== "CALCULATED") {
    throw new Error(
      "Calculation rules can only be deleted from calculated components.",
    );
  }

  await deleteReportComponentRule(schoolId, ruleId);

  redirect(
    `/school/report-settings/${configurationId}/components/${componentId}/rules`,
  );
}

export async function updateComponentRuleAction(
  configurationId: number,
  componentId: number,
  ruleId: number,
  previousState: ComponentRuleFormState,
  formData: FormData,
): Promise<ComponentRuleFormState> {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    return { error: "School context is required." };
  }

  const weight = Number(formData.get("weight"));

  if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
    return {
      error: "Weight must be greater than zero and cannot exceed 100%.",
    };
  }

  try {
    const component = await getReportComponent(schoolId, componentId);

    if (component.configurationId !== configurationId) {
      return {
        error: "Component does not belong to this report configuration.",
      };
    }

    if (component.type !== "CALCULATED") {
      return {
        error:
          "Calculation rules can only be updated for calculated components.",
      };
    }

    await updateReportComponentRule(schoolId, ruleId, weight);
  } catch (error) {
    if (error instanceof Error) {
      const friendlyMessages = [
        "Calculation rule not found.",
        "Calculation rules can only be updated for calculated components.",
        "Calculation rule weights cannot exceed 100%.",
        "Weight must be greater than zero and cannot exceed 100%.",
      ];

      if (friendlyMessages.includes(error.message)) {
        return { error: error.message };
      }
    }

    return {
      error: "Unable to update the calculation rule. Please try again.",
    };
  }

  redirect(
    `/school/report-settings/${configurationId}/components/${componentId}/rules`,
  );
}