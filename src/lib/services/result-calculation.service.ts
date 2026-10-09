import { db } from "@/prisma/db";

type ReportType = "MID_TERM" | "TERMINAL";
type AssessmentType =
  "ASSIGNMENT" | "TEST" | "CA" | "EXAM" | "PROJECT" | "PRACTICAL" | "OTHER";
type AssessmentAggregationType = "SUM" | "AVERAGE";
type ReportComponentType = "ASSESSMENT" | "CALCULATED";

interface CalculateSubjectResultInput {
  schoolId: number;
  studentId: number;
  classId: number;
  subjectId: number;
  termId: number;
  reportType: ReportType;
}

interface CalculateClassResultsInput {
  schoolId: number;
  classId: number;
  termId: number;
  reportType: ReportType;
}

interface ComponentCalculation {
  componentId: number;
  score: number;
  maxScore: number | null;
}

interface SubjectCalculation {
  totalScore: number;
  percentageScore: number;
  components: ComponentCalculation[];
  grade: string | null;
  remark: string | null;
}

interface StudentTermCalculation {
  totalScore: number;
  averageScore: number;
  grade: string | null;
  remark: string | null;
}

function roundScore(value: number, decimalPlaces = 2) {
  const factor = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function validateFiniteNumber(value: number, fieldName: string) {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }
}

async function getSchoolTerm(schoolId: number, termId: number) {
  const term = await db.orm.public.Term.where((item) =>
    item.id.eq(termId),
  ).first();

  if (!term) {
    throw new Error("Term not found.");
  }

  const session = await db.orm.public.AcademicSession.where((item) =>
    item.id.eq(term.sessionId),
  ).first();

  if (!session || session.schoolId !== schoolId) {
    throw new Error("Invalid term.");
  }

  return {
    term,
    session,
  };
}

async function validateStudent(
  schoolId: number,
  studentId: number,
  classId: number,
) {
  const student = await db.orm.public.Student.where((item) =>
    item.id.eq(studentId),
  ).first();

  if (
    !student ||
    student.schoolId !== schoolId ||
    student.classId !== classId
  ) {
    throw new Error("Invalid student.");
  }

  return student;
}

async function validateClass(schoolId: number, classId: number) {
  const schoolClass = await db.orm.public.SchoolClass.where((item) =>
    item.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    throw new Error("Invalid class.");
  }

  return schoolClass;
}

async function validateSubject(schoolId: number, subjectId: number) {
  const subject = await db.orm.public.Subject.where((item) =>
    item.id.eq(subjectId),
  ).first();

  if (!subject || subject.schoolId !== schoolId) {
    throw new Error("Invalid subject.");
  }

  return subject;
}

async function validateSubjectAssignedToClass(
  classId: number,
  subjectId: number,
) {
  const assignments = await db.orm.public.ClassSubject.where((item) =>
    item.classId.eq(classId),
  ).all();

  const assigned = assignments.some(
    (assignment) => assignment.subjectId === subjectId,
  );

  if (!assigned) {
    throw new Error("This subject is not assigned to the selected class.");
  }
}

async function getReportConfiguration(
  schoolId: number,
  reportType: ReportType,
) {
  const configurations = await db.orm.public.ReportConfiguration.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const configuration = configurations.find(
    (item) => item.reportType === reportType && item.isActive,
  );

  if (!configuration) {
    throw new Error(
      `No active ${reportType === "MID_TERM" ? "mid-term" : "terminal"} report configuration exists.`,
    );
  }

  return configuration;
}

async function getReportComponents(configurationId: number) {
  const components = await db.orm.public.ReportComponent.where((item) =>
    item.configurationId.eq(configurationId),
  ).all();

  return components.sort((a, b) => a.displayOrder - b.displayOrder);
}

async function getGradeForScore(schoolId: number, score: number) {
  const gradeScales = await db.orm.public.GradeScale.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const activeScales = gradeScales
    .filter((item) => item.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const matchingScale = activeScales.find(
    (scale) => score >= scale.minScore && score <= scale.maxScore,
  );

  if (!matchingScale) {
    return {
      grade: null,
      remark: null,
    };
  }

  return {
    grade: matchingScale.code,
    remark: matchingScale.remark,
  };
}

async function getStudentAssessmentScores(
  studentId: number,
  classId: number,
  subjectId: number,
  termId: number,
  assessmentType: AssessmentType,
) {
  const assessments = await db.orm.public.Assessment.where((assessment) =>
    assessment.termId.eq(termId),
  ).all();

  const matchingAssessments = assessments.filter(
    (assessment) =>
      assessment.classId === classId &&
      assessment.subjectId === subjectId &&
      assessment.type === assessmentType,
  );

  if (matchingAssessments.length === 0) {
    return [];
  }

  const assessmentIds = matchingAssessments.map((assessment) => assessment.id);

  const allScores = await db.orm.public.AssessmentScore.all();

  return matchingAssessments
    .map((assessment) => {
      const score = allScores.find(
        (item) =>
          item.assessmentId === assessment.id && item.studentId === studentId,
      );

      if (!score) {
        return null;
      }

      return {
        assessmentId: assessment.id,
        score: score.score,
        maxScore: assessment.maxScore,
      };
    })
    .filter(
      (
        item,
      ): item is {
        assessmentId: number;
        score: number;
        maxScore: number;
      } => item !== null,
    );
}

async function calculateAssessmentComponent(
  studentId: number,
  classId: number,
  subjectId: number,
  termId: number,
  component: {
    id: number;
    assessmentType: AssessmentType | null;
    aggregationType: AssessmentAggregationType;
    maxScore: number | null;
  },
) {
  if (!component.assessmentType) {
    throw new Error(
      `Assessment component ${component.id} has no assessment type.`,
    );
  }

  if (component.maxScore === null || component.maxScore <= 0) {
    throw new Error(
      `Assessment component ${component.id} must have a valid maximum score.`,
    );
  }

  const scores = await getStudentAssessmentScores(
    studentId,
    classId,
    subjectId,
    termId,
    component.assessmentType,
  );

  if (scores.length === 0) {
    return {
      score: 0,
      maxScore: component.maxScore,
    };
  }

  let percentage: number;

  if (component.aggregationType === "SUM") {
    const rawScore = scores.reduce((total, item) => total + item.score, 0);

    const rawMaxScore = scores.reduce(
      (total, item) => total + item.maxScore,
      0,
    );

    if (rawMaxScore <= 0) {
      throw new Error(
        `Invalid assessment maximum score for component ${component.id}.`,
      );
    }

    percentage = (rawScore / rawMaxScore) * 100;
  } else {
    const percentages = scores.map(
      (item) => (item.score / item.maxScore) * 100,
    );

    percentage =
      percentages.reduce((total, value) => total + value, 0) /
      percentages.length;
  }

  const calculatedScore = (percentage / 100) * component.maxScore;

  return {
    score: roundScore(calculatedScore),
    maxScore: component.maxScore,
  };
}

async function getComponentRules(componentId: number) {
  return db.orm.public.ReportComponentRule.where((rule) =>
    rule.componentId.eq(componentId),
  ).all();
}

async function validateComponentDependencies(
  components: Array<{
    id: number;
    name: string;
    type: ReportComponentType;
  }>,
) {
  const componentIds = new Set(components.map((component) => component.id));

  const visiting = new Set<number>();
  const visited = new Set<number>();

  async function visit(componentId: number) {
    if (visited.has(componentId)) {
      return;
    }

    if (visiting.has(componentId)) {
      throw new Error(
        "Circular dependency detected in report component configuration.",
      );
    }

    visiting.add(componentId);

    const rules = await getComponentRules(componentId);

    for (const rule of rules) {
      if (!componentIds.has(rule.sourceComponentId)) {
        throw new Error(
          `Report component ${componentId} references a component outside its configuration.`,
        );
      }

      await visit(rule.sourceComponentId);
    }

    visiting.delete(componentId);
    visited.add(componentId);
  }

  for (const component of components) {
    await visit(component.id);
  }
}

async function calculateCalculatedComponent(
  component: {
    id: number;
    name: string;
    maxScore: number | null;
  },
  calculatedComponents: Map<number, ComponentCalculation>,
) {
  if (component.maxScore === null || component.maxScore <= 0) {
    throw new Error(
      `Calculated component "${component.name}" must have a valid maximum score.`,
    );
  }

  const rules = await getComponentRules(component.id);

  if (rules.length === 0) {
    throw new Error(
      `Calculated component "${component.name}" has no calculation rules.`,
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

  let percentage = 0;

  for (const rule of rules) {
    const source = calculatedComponents.get(rule.sourceComponentId);

    if (!source) {
      throw new Error(
        `Source component ${rule.sourceComponentId} has not been calculated.`,
      );
    }

    if (!source.maxScore || source.maxScore <= 0) {
      throw new Error(
        `Source component ${rule.sourceComponentId} has an invalid maximum score.`,
      );
    }

    const sourcePercentage = (source.score / source.maxScore) * 100;

    percentage += sourcePercentage * ((rule.weight ?? 0) / 100);
  }

  return {
    score: roundScore((percentage / 100) * component.maxScore),
    maxScore: component.maxScore,
  };
}

async function calculateSubject(input: CalculateSubjectResultInput): Promise<
  SubjectCalculation & {
    components: ComponentCalculation[];
  }
> {
  await validateClass(input.schoolId, input.classId);

  await validateSubject(input.schoolId, input.subjectId);

  await validateStudent(input.schoolId, input.studentId, input.classId);

  await validateSubjectAssignedToClass(input.classId, input.subjectId);

  await getSchoolTerm(input.schoolId, input.termId);

  const configuration = await getReportConfiguration(
    input.schoolId,
    input.reportType,
  );

  const components = await getReportComponents(configuration.id);

  if (components.length === 0) {
    throw new Error("The report configuration has no components.");
    }
    
    await validateComponentDependencies(components);

const calculatedComponents = new Map<number, ComponentCalculation>();

const componentResults: ComponentCalculation[] = [];
const componentsById = new Map(
  components.map((component) => [component.id, component]),
);

const calculating = new Set<number>();

async function calculateComponent(
  componentId: number,
): Promise<ComponentCalculation> {
  const existing = calculatedComponents.get(componentId);

  if (existing) {
    return existing;
  }

  if (calculating.has(componentId)) {
    throw new Error(
      "Circular dependency detected in report component configuration.",
    );
  }

  const component = componentsById.get(componentId);

  if (!component) {
    throw new Error(`Report component ${componentId} was not found.`);
  }

  calculating.add(componentId);

  if (component.type === "CALCULATED") {
    const rules = await getComponentRules(component.id);

    for (const rule of rules) {
      await calculateComponent(rule.sourceComponentId);
    }
  }

  let result: {
    score: number;
    maxScore: number | null;
  };

  if (component.type === "ASSESSMENT") {
    result = await calculateAssessmentComponent(
      input.studentId,
      input.classId,
      input.subjectId,
      input.termId,
      component,
    );
  } else {
    result = await calculateCalculatedComponent(
      component,
      calculatedComponents,
    );
  }

  const calculation: ComponentCalculation = {
    componentId: component.id,
    score: result.score,
    maxScore: result.maxScore,
  };

  calculatedComponents.set(component.id, calculation);

  calculating.delete(componentId);

  componentResults.push(calculation);

  return calculation;
}

for (const component of components) {
  await calculateComponent(component.id);
}

  const totalComponents = components.filter(
    (component) => component.countsTowardTotal,
  );

  const totalComponentIds = new Set(
    totalComponents.map((component) => component.id),
  );

  const totalScore = roundScore(
    componentResults
      .filter((component) => totalComponentIds.has(component.componentId))
      .reduce((total, component) => total + component.score, 0),
  );

  const totalMaxScore = componentResults
    .filter((component) => totalComponentIds.has(component.componentId))
    .reduce((total, component) => total + (component.maxScore ?? 0), 0);

  if (totalMaxScore <= 0) {
    throw new Error("The report configuration has no valid maximum score.");
  }

  const normalizedScore = roundScore((totalScore / totalMaxScore) * 100);

  const gradeResult = await getGradeForScore(input.schoolId, normalizedScore);

 return {
   totalScore,
   percentageScore: normalizedScore,
   components: componentResults,
   grade: gradeResult.grade,
   remark: gradeResult.remark,
 };
}

/**
 * Calculate and save one student's result for one subject.
 */
export async function calculateAndSaveSubjectResult(
  input: CalculateSubjectResultInput,
) {
  const calculation = await calculateSubject(input);

 const subjectResults = await db.orm.public.SubjectResult.where((result) =>
   result.studentId.eq(input.studentId),
 ).all();

 let subjectResult =
   subjectResults.find(
     (result) =>
       result.subjectId === input.subjectId &&
       result.classId === input.classId &&
       result.termId === input.termId &&
       result.reportType === input.reportType,
   ) ?? null;

  if (subjectResult) {
    subjectResult = await db.orm.public.SubjectResult.where((result) =>
      result.id.eq(subjectResult!.id),
    ).update({
      schoolId: input.schoolId,
      classId: input.classId,
      totalScore: calculation.totalScore,
      percentageScore: calculation.percentageScore,
      grade: calculation.grade,
      remark: calculation.remark,
    });

    const existingComponentScores =
      await db.orm.public.ResultComponentScore.where((score) =>
        score.subjectResultId.eq(subjectResult!.id),
      ).all();

    for (const component of calculation.components) {
      const existing = existingComponentScores.find(
        (score) => score.componentId === component.componentId,
      );

      if (existing) {
        await db.orm.public.ResultComponentScore.where((score) =>
          score.id.eq(existing.id),
        ).update({
          score: component.score,
          maxScore: component.maxScore,
        });
      } else {
        await db.orm.public.ResultComponentScore.create({
          subjectResultId: subjectResult!.id,
          componentId: component.componentId,
          score: component.score,
          maxScore: component.maxScore,
        });
      }
    }

    return subjectResult;
  }

  subjectResult = await db.orm.public.SubjectResult.create({
    schoolId: input.schoolId,
    studentId: input.studentId,
    classId: input.classId,
    subjectId: input.subjectId,
    termId: input.termId,
    reportType: input.reportType,
    totalScore: calculation.totalScore,
    grade: calculation.grade,
    remark: calculation.remark,
    percentageScore: calculation.percentageScore,
  });

  for (const component of calculation.components) {
    await db.orm.public.ResultComponentScore.create({
      subjectResultId: subjectResult.id,
      componentId: component.componentId,
      score: component.score,
      maxScore: component.maxScore,
    });
  }

  return subjectResult;
}

/**
 * Get a student's calculated subject result.
 */
export async function getStudentSubjectResult(
  schoolId: number,
  studentId: number,
  subjectId: number,
  termId: number,
  reportType: ReportType,
) {
  const results = await db.orm.public.SubjectResult.where((result) =>
    result.studentId.eq(studentId),
  ).all();

  return (
    results.find(
      (result) =>
        result.schoolId === schoolId &&
        result.subjectId === subjectId &&
        result.termId === termId &&
        result.reportType === reportType,
    ) ?? null
  );

  return results[0] ?? null;
}

/**
 * Calculate and save all subject results for every student
 * in a class.
 */
export async function calculateClassSubjectResults(
  input: CalculateClassResultsInput,
) {
  const schoolClass = await validateClass(input.schoolId, input.classId);

  await getSchoolTerm(input.schoolId, input.termId);

  const students = await db.orm.public.Student.where((student) =>
    student.schoolId.eq(input.schoolId),
  ).all();

  const classStudents = students.filter(
    (student) => student.classId === input.classId,
  );

  const classSubjects = await db.orm.public.ClassSubject.where((item) =>
    item.classId.eq(input.classId),
  ).all();

  const results = [];

  for (const student of classStudents) {
    for (const classSubject of classSubjects) {
      results.push(
        await calculateAndSaveSubjectResult({
          schoolId: input.schoolId,
          studentId: student.id,
          classId: schoolClass.id,
          subjectId: classSubject.subjectId,
          termId: input.termId,
          reportType: input.reportType,
        }),
      );
    }
  }

  return results;
}

/**
 * Calculate one student's overall term result
 * from their subject results.
 */
export async function calculateAndSaveStudentTermResult(
  input: CalculateClassResultsInput & {
    studentId: number;
  },
) {
  const schoolClass = await validateClass(input.schoolId, input.classId);

  await validateStudent(input.schoolId, input.studentId, input.classId);

  await getSchoolTerm(input.schoolId, input.termId);

  const classTeacherId = schoolClass.classTeacherId ?? null;

  const allStudentSubjectResults = await db.orm.public.SubjectResult.where(
    (result) => result.studentId.eq(input.studentId),
  ).all();

  const subjectResults = allStudentSubjectResults.filter(
    (result) =>
      result.schoolId === input.schoolId &&
      result.classId === input.classId &&
      result.termId === input.termId &&
      result.reportType === input.reportType,
  );

  if (subjectResults.length === 0) {
    throw new Error("No subject results exist for this student.");
  }

  const classSubjects = await db.orm.public.ClassSubject.where((item) =>
    item.classId.eq(input.classId),
  ).all();

  const requiredSubjectIds = new Set(
    classSubjects.map((classSubject) => classSubject.subjectId),
  );

  const completedSubjectIds = new Set(
    subjectResults.map((result) => result.subjectId),
  );

  const missingSubjectIds = [...requiredSubjectIds].filter(
    (subjectId) => !completedSubjectIds.has(subjectId),
  );

  if (missingSubjectIds.length > 0) {
    throw new Error(
      `Incomplete results. ${missingSubjectIds.length} subject result(s) are missing.`,
    );
  }

  const totalScore = roundScore(
    subjectResults.reduce((total, result) => total + result.totalScore, 0),
  );

  const averageScore = roundScore(
    subjectResults.reduce(
      (total, result) => total + result.percentageScore,
      0,
    ) / subjectResults.length,
  );

  const gradeResult = await getGradeForScore(input.schoolId, averageScore);

  const allStudentTermResults = await db.orm.public.StudentTermResult.where(
    (result) => result.studentId.eq(input.studentId),
  ).all();

 let studentTermResult =
   allStudentTermResults.find(
     (result) =>
       result.classId === input.classId &&
       result.termId === input.termId &&
       result.reportType === input.reportType,
   ) ?? null;

  if (studentTermResult) {
    studentTermResult = await db.orm.public.StudentTermResult.where((result) =>
      result.id.eq(studentTermResult!.id),
    ).update({
      schoolId: input.schoolId,
      classId: input.classId,
      classTeacherId,
      totalScore,
      averageScore,
      grade: gradeResult.grade,
      remark: gradeResult.remark,
    });

    return studentTermResult;
  }

  return db.orm.public.StudentTermResult.create({
    schoolId: input.schoolId,
    studentId: input.studentId,
    classId: input.classId,
    classTeacherId,
    termId: input.termId,
    reportType: input.reportType,
    totalScore,
    averageScore,
    position: null,
    grade: gradeResult.grade,
    remark: gradeResult.remark,
  });
}

/**
 * Calculate overall term results for every student
 * in a class.
 *
 * Position is calculated after all student results exist.
 */
/**
 * Calculate overall term results for every student
 * in a class.
 *
 * Students are checked for complete assessment scores
 * BEFORE subject results are generated.
 *
 * Students with missing required assessments remain pending
 * and do not receive zero SubjectResult records.
 *
 * Position is calculated after all completed student
 * term results exist.
 */
export async function calculateClassTermResults(
  input: CalculateClassResultsInput,
) {
  await validateClass(input.schoolId, input.classId);
  await getSchoolTerm(input.schoolId, input.termId);

  const students = await db.orm.public.Student.where((student) =>
    student.schoolId.eq(input.schoolId),
  ).all();

  const classStudents = students.filter(
    (student) => student.classId === input.classId,
  );

  const classSubjects = await db.orm.public.ClassSubject.where((item) =>
    item.classId.eq(input.classId),
  ).all();

  const configuration = await getReportConfiguration(
    input.schoolId,
    input.reportType,
  );

  const components = await getReportComponents(configuration.id);

  const assessmentComponents = components.filter(
    (component) =>
      component.type === "ASSESSMENT" && component.assessmentType,
  );

  const generatedResults = [];
  const pendingStudents = [];

  for (const student of classStudents) {
    let missingSubjectCount = 0;

    /**
     * First check whether the student has every required
     * assessment score for every subject.
     *
     * We do this BEFORE generating SubjectResult records.
     */
    for (const classSubject of classSubjects) {
      const subjectHasAllRequiredScores = await Promise.all(
        assessmentComponents.map(async (component) => {
          const scores = await getStudentAssessmentScores(
            student.id,
            input.classId,
            classSubject.subjectId,
            input.termId,
            component.assessmentType!,
          );

          return scores.length > 0;
        }),
      );

      if (!subjectHasAllRequiredScores.every(Boolean)) {
        missingSubjectCount += 1;
      }
    }

    /**
     * If any subject is incomplete, leave the student pending.
     *
     * IMPORTANT:
     * We do NOT call calculateAndSaveSubjectResult()
     * for this student.
     */
    if (missingSubjectCount > 0) {
      pendingStudents.push({
        studentId: student.id,
        missingSubjectCount,
      });

      continue;
    }

    /**
     * The student has all required assessment scores.
     *
     * Now generate/save the SubjectResult for every subject.
     */
    for (const classSubject of classSubjects) {
      await calculateAndSaveSubjectResult({
        schoolId: input.schoolId,
        studentId: student.id,
        classId: input.classId,
        subjectId: classSubject.subjectId,
        termId: input.termId,
        reportType: input.reportType,
      });
    }

    /**
     * Now that all SubjectResults exist, calculate
     * the student's overall term result.
     */
    const result = await calculateAndSaveStudentTermResult({
      schoolId: input.schoolId,
      studentId: student.id,
      classId: input.classId,
      termId: input.termId,
      reportType: input.reportType,
    });

    generatedResults.push(result);
  }

  /**
   * Only completed students receive positions.
   */
  if (generatedResults.length > 0) {
    await assignClassPositions(
      input.schoolId,
      input.classId,
      input.termId,
      input.reportType,
    );
  }

  return {
    results: generatedResults,
    pendingStudents,
  };
}

/**
 * Assign positions to students based on average score.
 *
 * Students with the same average receive the same position.
 * The next position skips accordingly.
 *
 * Example:
 * 1st
 * 2nd
 * 2nd
 * 4th
 */
export async function assignClassPositions(
  schoolId: number,
  classId: number,
  termId: number,
  reportType: ReportType,
) {
  const results = await db.orm.public.StudentTermResult.where(
    (result) =>
      result.schoolId.eq(schoolId) &&
      result.classId.eq(classId) &&
      result.termId.eq(termId) &&
      result.reportType.eq(reportType),
  ).all();

  const rankedResults = [...results].sort(
    (a, b) => b.averageScore - a.averageScore,
  );

  let previousScore: number | null = null;
  let currentPosition = 0;

  for (let index = 0; index < rankedResults.length; index += 1) {
    const result = rankedResults[index];

    if (previousScore === null || result.averageScore !== previousScore) {
      currentPosition = index + 1;
    }

    await db.orm.public.StudentTermResult.where((item) =>
      item.id.eq(result.id),
    ).update({
      position: currentPosition,
    });

    previousScore = result.averageScore;
  }

  return true;
}

/**
 * Get a student's complete term result.
 */
export async function getStudentTermResult(
  schoolId: number,
  studentId: number,
  termId: number,
  reportType: ReportType,
) {
  const result = await db.orm.public.StudentTermResult.where(
    (item) =>
      item.schoolId.eq(schoolId) &&
      item.studentId.eq(studentId) &&
      item.termId.eq(termId) &&
      item.reportType.eq(reportType),
  ).first();

  return result;
}

/**
 * Get all student term results for a class.
 */
export async function getClassTermResults(
  schoolId: number,
  classId: number,
  termId: number,
  reportType: ReportType,
) {
  const results = await db.orm.public.StudentTermResult.where(
    (item) =>
      item.schoolId.eq(schoolId) &&
      item.classId.eq(classId) &&
      item.termId.eq(termId) &&
      item.reportType.eq(reportType),
  ).all();

  return results.sort((a, b) => {
    if (a.position === null && b.position === null) {
      return b.averageScore - a.averageScore;
    }

    if (a.position === null) {
      return 1;
    }

    if (b.position === null) {
      return -1;
    }

    return a.position - b.position;
  });
}
