import { db } from "@/prisma/db";

type ReportType = "MID_TERM" | "TERMINAL";
type ReportComponentType = "ASSESSMENT" | "CALCULATED";
type AssessmentType =
  "ASSIGNMENT" | "TEST" | "CA" | "EXAM" | "PROJECT" | "PRACTICAL" | "OTHER";

type AssessmentAggregationType = "SUM" | "AVERAGE";

interface CreateReportConfigurationInput {
  schoolId: number;
  reportType: ReportType;
  name: string;
}

interface CreateReportComponentInput {
  configurationId: number;
  name: string;
  type: ReportComponentType;
  assessmentType?: AssessmentType;
  aggregationType?: AssessmentAggregationType;
  maxScore?: number;
  weight?: number;
  displayOrder: number;
  isRequired?: boolean;
  isVisible?: boolean;
}

interface UpdateReportConfigurationInput {
  name?: string;
  isActive?: boolean;
  showClassPosition?: boolean;
  showClassTeacherName?: boolean;
  showPrincipalSignature?: boolean;
  showSchoolStamp?: boolean;
  showAttendance?: boolean;
}

interface UpdateReportComponentInput {
  name?: string;
  assessmentType?: AssessmentType | null;
  aggregationType?: AssessmentAggregationType;
  maxScore?: number | null;
  weight?: number | null;
  displayOrder?: number;
  isRequired?: boolean;
  isVisible?: boolean;
}

interface CreateComponentRuleInput {
  componentId: number;
  sourceComponentId: number;
  weight: number;
}

async function getConfigurationById(configurationId: number) {
  return db.orm.public.ReportConfiguration.where((configuration) =>
    configuration.id.eq(configurationId),
  ).first();
}

async function getComponentById(componentId: number) {
  return db.orm.public.ReportComponent.where((component) =>
    component.id.eq(componentId),
  ).first();
}

async function validateConfigurationOwnership(
  configurationId: number,
  schoolId: number,
) {
  const configuration = await getConfigurationById(configurationId);

  if (!configuration || configuration.schoolId !== schoolId) {
    throw new Error("Invalid report configuration.");
  }

  return configuration;
}

async function validateComponentOwnership(
  componentId: number,
  schoolId: number,
) {
  const component = await getComponentById(componentId);

  if (!component) {
    throw new Error("Report component not found.");
  }

  const configuration = await getConfigurationById(component.configurationId);

  if (!configuration || configuration.schoolId !== schoolId) {
    throw new Error("Invalid report component.");
  }

  return {
    component,
    configuration,
  };
}

function validatePositiveNumber(
  value: number | undefined | null,
  fieldName: string,
) {
  if (value !== undefined && value !== null) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`${fieldName} must be greater than zero.`);
    }
  }
}

function validateWeight(weight: number) {
  if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
    throw new Error("Weight must be greater than 0 and at most 100.");
  }
}

/**
 * Create the report configuration for a school.
 */
export async function createReportConfiguration(
  input: CreateReportConfigurationInput,
) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Report configuration name is required.");
  }

  const existingConfigurations = await db.orm.public.ReportConfiguration.where(
    (configuration) => configuration.schoolId.eq(input.schoolId),
  ).all();

  const alreadyExists = existingConfigurations.some(
    (configuration) => configuration.reportType === input.reportType,
  );

  if (alreadyExists) {
    throw new Error(
      `A ${
        input.reportType === "MID_TERM" ? "mid-term" : "terminal"
      } report configuration already exists.`,
    );
  }

  return db.orm.public.ReportConfiguration.create({
    schoolId: input.schoolId,
    reportType: input.reportType,
    name,
  });
}

/**
 * Get a school's configuration for a specific report type.
 */
export async function getReportConfiguration(
  schoolId: number,
  reportType: ReportType,
) {
  const configurations = await db.orm.public.ReportConfiguration.where(
    (configuration) => configuration.schoolId.eq(schoolId),
  ).all();

  return (
    configurations.find(
      (configuration) => configuration.reportType === reportType,
    ) ?? null
  );
}

/**
 * Get all report configurations belonging to a school.
 */
export async function getReportConfigurations(schoolId: number) {
  return db.orm.public.ReportConfiguration.where((configuration) =>
    configuration.schoolId.eq(schoolId),
  ).all();
}

/**
 * Update a report configuration.
 */
export async function updateReportConfiguration(
  schoolId: number,
  configurationId: number,
  input: UpdateReportConfigurationInput,
) {
  const configuration = await validateConfigurationOwnership(
    configurationId,
    schoolId,
  );

  const nextName =
    input.name !== undefined ? input.name.trim() : configuration.name;

  if (!nextName) {
    throw new Error("Report configuration name is required.");
  }

  return db.orm.public.ReportConfiguration.where((item) =>
    item.id.eq(configurationId),
  ).update({
    name: nextName,
    isActive: input.isActive ?? configuration.isActive,
    showClassPosition:
      input.showClassPosition ?? configuration.showClassPosition,
    showClassTeacherName:
      input.showClassTeacherName ?? configuration.showClassTeacherName,
    showPrincipalSignature:
      input.showPrincipalSignature ?? configuration.showPrincipalSignature,
    showSchoolStamp: input.showSchoolStamp ?? configuration.showSchoolStamp,
    showAttendance: input.showAttendance ?? configuration.showAttendance,
  });
}

/**
 * Create a component inside a report configuration.
 */
export async function createReportComponent(
  schoolId: number,
  input: CreateReportComponentInput,
) {
  const configuration = await validateConfigurationOwnership(
    input.configurationId,
    schoolId,
  );

  const name = input.name.trim();

  if (!name) {
    throw new Error("Report component name is required.");
  }

  if (input.displayOrder < 1) {
    throw new Error("Display order must be at least 1.");
  }

  validatePositiveNumber(input.maxScore, "Maximum score");
  validatePositiveNumber(input.weight, "Weight");

  if (input.type === "ASSESSMENT") {
    if (!input.assessmentType) {
      throw new Error(
        "Assessment type is required for an assessment component.",
      );
    }
  }

  if (input.type === "CALCULATED") {
    if (input.assessmentType) {
      throw new Error(
        "Assessment type cannot be set on a calculated component.",
      );
    }
  }

  const existingComponents = await db.orm.public.ReportComponent.where(
    (component) => component.configurationId.eq(configuration.id),
  ).all();

  const duplicateName = existingComponents.some(
    (component) => component.name.toLowerCase() === name.toLowerCase(),
  );

  if (duplicateName) {
    throw new Error(
      "A report component with this name already exists in this configuration.",
    );
  }

  return db.orm.public.ReportComponent.create({
    configurationId: configuration.id,
    name,
    type: input.type,
    assessmentType: input.assessmentType ?? null,
    aggregationType: input.aggregationType ?? "SUM",
    maxScore: input.maxScore ?? null,
    weight: input.weight ?? null,
    displayOrder: input.displayOrder,
    isRequired: input.isRequired ?? true,
    isVisible: input.isVisible ?? true,
  });
}

/**
 * Get all components belonging to a school's report configuration.
 */
export async function getReportComponents(
  schoolId: number,
  configurationId: number,
) {
  await validateConfigurationOwnership(configurationId, schoolId);

  const components = await db.orm.public.ReportComponent.where((component) =>
    component.configurationId.eq(configurationId),
  ).all();

  return components.sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get a single report component.
 */
export async function getReportComponent(
  schoolId: number,
  componentId: number,
) {
  const { component } = await validateComponentOwnership(componentId, schoolId);

  return component;
}

/**
 * Update a report component.
 */
export async function updateReportComponent(
  schoolId: number,
  componentId: number,
  input: UpdateReportComponentInput,
) {
  const { component, configuration } = await validateComponentOwnership(
    componentId,
    schoolId,
  );

  const nextName =
    input.name !== undefined ? input.name.trim() : component.name;

  if (!nextName) {
    throw new Error("Report component name is required.");
  }

  if (input.displayOrder !== undefined && input.displayOrder < 1) {
    throw new Error("Display order must be at least 1.");
  }

  const nextMaxScore =
    input.maxScore !== undefined ? input.maxScore : component.maxScore;

  const nextWeight =
    input.weight !== undefined ? input.weight : component.weight;

  validatePositiveNumber(nextMaxScore, "Maximum score");
  validatePositiveNumber(nextWeight, "Weight");

  if (component.type === "ASSESSMENT") {
    const nextAssessmentType =
      input.assessmentType !== undefined
        ? input.assessmentType
        : component.assessmentType;

    if (!nextAssessmentType) {
      throw new Error(
        "Assessment type is required for an assessment component.",
      );
    }
  }

  if (component.type === "CALCULATED") {
    if (input.assessmentType !== undefined && input.assessmentType !== null) {
      throw new Error(
        "Assessment type cannot be set on a calculated component.",
      );
    }
  }

  const existingComponents = await db.orm.public.ReportComponent.where(
    (existingComponent) =>
      existingComponent.configurationId.eq(configuration.id),
  ).all();

  const duplicateName = existingComponents.some(
    (existingComponent) =>
      existingComponent.id !== componentId &&
      existingComponent.name.toLowerCase() === nextName.toLowerCase(),
  );

  if (duplicateName) {
    throw new Error(
      "A report component with this name already exists in this configuration.",
    );
  }

  return db.orm.public.ReportComponent.where((reportComponent) =>
    reportComponent.id.eq(componentId),
  ).update({
    name: nextName,
    assessmentType:
      input.assessmentType !== undefined
        ? input.assessmentType
        : component.assessmentType,
    aggregationType: input.aggregationType ?? component.aggregationType,
    maxScore: nextMaxScore,
    weight: nextWeight,
    displayOrder: input.displayOrder ?? component.displayOrder,
    isRequired: input.isRequired ?? component.isRequired,
    isVisible: input.isVisible ?? component.isVisible,
  });
}

/**
 * Delete a report component.
 *
 * Components that are used by calculation rules cannot be deleted.
 */
export async function deleteReportComponent(
  schoolId: number,
  componentId: number,
) {
  const { component } = await validateComponentOwnership(componentId, schoolId);

  const rulesUsingComponent = await db.orm.public.ReportComponentRule.where(
    (rule) => rule.sourceComponentId.eq(componentId),
  ).all();

  if (rulesUsingComponent.length > 0) {
    throw new Error(
      "This component is used by another calculated component and cannot be deleted.",
    );
  }

  const resultScores = await db.orm.public.ResultComponentScore.where((score) =>
    score.componentId.eq(componentId),
  ).all();

  if (resultScores.length > 0) {
    throw new Error(
      "This component already has result scores and cannot be deleted.",
    );
  }

  const rulesOwnedByComponent = await db.orm.public.ReportComponentRule.where(
    (rule) => rule.componentId.eq(componentId),
  ).all();

  for (const rule of rulesOwnedByComponent) {
    await db.orm.public.ReportComponentRule.where((reportComponentRule) =>
      reportComponentRule.id.eq(rule.id),
    ).delete();
  }

  return db.orm.public.ReportComponent.where((reportComponent) =>
    reportComponent.id.eq(component.id),
  ).delete();
}

/**
 * Add a calculation rule to a calculated component.
 *
 * The source component contributes the specified percentage
 * to the calculated component.
 */
export async function addReportComponentRule(
  schoolId: number,
  input: CreateComponentRuleInput,
) {
  const { component, configuration } = await validateComponentOwnership(
    input.componentId,
    schoolId,
  );

  if (component.type !== "CALCULATED") {
    throw new Error(
      "Calculation rules can only be added to calculated components.",
    );
  }

  if (input.componentId === input.sourceComponentId) {
    throw new Error("A component cannot use itself as a calculation source.");
  }

  validateWeight(input.weight);

  const { component: sourceComponent } = await validateComponentOwnership(
    input.sourceComponentId,
    schoolId,
  );

  const sourceConfiguration = await getConfigurationById(
    sourceComponent.configurationId,
  );

  if (!sourceConfiguration || sourceConfiguration.id !== configuration.id) {
    throw new Error(
      "Source component must belong to the same report configuration.",
    );
  }

  const existingRules = await db.orm.public.ReportComponentRule.where((rule) =>
    rule.componentId.eq(input.componentId),
  ).all();

  const duplicateSource = existingRules.some(
    (rule) => rule.sourceComponentId === input.sourceComponentId,
  );

  if (duplicateSource) {
    throw new Error(
      "This source component is already part of the calculation.",
    );
  }

  const currentWeight = existingRules.reduce(
    (total, rule) => total + (rule.weight ?? 0),
    0,
  );

  const nextWeight = currentWeight + input.weight;

  if (nextWeight > 100) {
    throw new Error("Calculation rule weights cannot exceed 100%.");
  }

  return db.orm.public.ReportComponentRule.create({
    componentId: input.componentId,
    sourceComponentId: input.sourceComponentId,
    weight: input.weight,
  });
}

export async function updateReportComponentRule(
  schoolId: number,
  ruleId: number,
  weight: number,
) {
  const rule = await db.orm.public.ReportComponentRule.where((item) =>
    item.id.eq(ruleId),
  ).first();

  if (!rule) {
    throw new Error("Calculation rule not found.");
  }

  const { component } = await validateComponentOwnership(
    rule.componentId,
    schoolId,
  );

  if (component.type !== "CALCULATED") {
    throw new Error(
      "Calculation rules can only be updated for calculated components.",
    );
  }

  validateWeight(weight);

  const existingRules = await db.orm.public.ReportComponentRule.where((item) =>
    item.componentId.eq(rule.componentId),
  ).all();

  const currentWeight = existingRules.reduce(
    (total, item) => total + (item.id === ruleId ? 0 : (item.weight ?? 0)),
    0,
  );

  if (currentWeight + weight > 100) {
    throw new Error("Calculation rule weights cannot exceed 100%.");
  }

  return db.orm.public.ReportComponentRule.where((item) =>
    item.id.eq(ruleId),
  ).update({
    weight,
  });
}

/**
 * Get calculation rules belonging to a component.
 */
export async function getReportComponentRules(
  schoolId: number,
  componentId: number,
) {
  await validateComponentOwnership(componentId, schoolId);

  return db.orm.public.ReportComponentRule.where((rule) =>
    rule.componentId.eq(componentId),
  ).all();
}

/**
 * Remove a calculation rule.
 */
export async function deleteReportComponentRule(
  schoolId: number,
  ruleId: number,
) {
  const rule = await db.orm.public.ReportComponentRule.where((item) =>
    item.id.eq(ruleId),
  ).first();

  if (!rule) {
    throw new Error("Calculation rule not found.");
  }

  await validateComponentOwnership(rule.componentId, schoolId);

  return db.orm.public.ReportComponentRule.where((reportComponentRule) =>
    reportComponentRule.id.eq(rule.id),
  ).delete();
}

/**
 * Validate that a calculated component has a complete
 * and valid set of calculation rules.
 *
 * This should be called before calculating student results.
 */
export async function validateCalculatedComponent(
  schoolId: number,
  componentId: number,
) {
  const { component } = await validateComponentOwnership(componentId, schoolId);

  if (component.type !== "CALCULATED") {
    throw new Error("Only calculated components require calculation rules.");
  }

  const rules = await db.orm.public.ReportComponentRule.where((rule) =>
    rule.componentId.eq(componentId),
  ).all();

  if (rules.length === 0) {
    throw new Error(
      `Calculated component "${component.name}" must have at least one calculation rule.`,
    );
  }

  const totalWeight = rules.reduce(
    (total, rule) => total + (rule.weight ?? 0),
    0,
  );

  if (Math.abs(totalWeight - 100) > 0.0001) {
    throw new Error(
      `Calculation rule weights for "${component.name}" must total 100%. Current total: ${totalWeight}%.`,
    );
  }

  return true;
}
