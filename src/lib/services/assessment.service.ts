import { db } from "@/prisma/db";
import { calculateAndSaveSubjectResult } from "@/lib/services/result-calculation.service";
type DatabaseClient = Pick<typeof db, "orm">;

type AssessmentType =
  "ASSIGNMENT" | "TEST" | "CA" | "EXAM" | "PROJECT" | "PRACTICAL" | "OTHER";

async function validateAssessmentCategory(
  schoolId: number,
  assessmentCategoryId: number | null | undefined,
  assessmentType: AssessmentType,
): Promise<number | null> {
  if (assessmentCategoryId == null) {
    return null;
  }

  if (!Number.isInteger(assessmentCategoryId) || assessmentCategoryId <= 0) {
    throw new Error("Invalid assessment category.");
  }

  const category = await db.orm.public.AssessmentCategory.where((item) =>
    item.id.eq(assessmentCategoryId),
  ).first();

  if (!category || category.schoolId !== schoolId) {
    throw new Error("Assessment category not found.");
  }

  if (!category.isActive) {
    throw new Error("This assessment category is inactive.");
  }

  if (category.type !== assessmentType) {
    throw new Error(
      "The assessment type must match the selected category type.",
    );
  }

  return category.id;
}

type CreateAssessmentInput = {
  schoolId: number;
  classId: number;
  subjectId: number;
  termId: number;
  createdById: number;
  title: string;
  type: AssessmentType;
  maxScore: number;
  weight: number;
  date?: string;
  description?: string;
  assessmentCategoryId?: number | null;
};

export async function createAssessment(input: CreateAssessmentInput) {
  const {
    schoolId,
    classId,
    subjectId,
    termId,
    createdById,
    title,
    type,
    maxScore,
    weight,
    date,
    description,
    assessmentCategoryId,
  } = input;

  if (!title.trim()) {
    throw new Error("Assessment title is required.");
  }

  if (!Number.isFinite(maxScore) || maxScore <= 0) {
    throw new Error("Maximum score must be a finite number greater than zero.");
  }

  if (!Number.isFinite(weight) || weight <= 0) {
    throw new Error(
      "Assessment weight must be a finite number greater than zero.",
    );
  }

  const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    throw new Error("Invalid class.");
  }

  const subject = await db.orm.public.Subject.where((subject) =>
    subject.id.eq(subjectId),
  ).first();

  if (!subject || subject.schoolId !== schoolId) {
    throw new Error("Invalid subject.");
  }

  const classSubjects = await db.orm.public.ClassSubject.where((assignment) =>
    assignment.classId.eq(classId),
  ).all();

  const subjectAssigned = classSubjects.some(
    (assignment) => assignment.subjectId === subjectId,
  );

  if (!subjectAssigned) {
    throw new Error("This subject is not assigned to this class.");
  }

  const term = await db.orm.public.Term.where((term) =>
    term.id.eq(termId),
  ).first();

  if (!term) {
    throw new Error("Invalid term.");
  }

  const academicSession = await db.orm.public.AcademicSession.where((session) =>
    session.id.eq(term.sessionId),
  ).first();

  if (!academicSession || academicSession.schoolId !== schoolId) {
    throw new Error("Invalid academic session.");
  }

  if (!academicSession.isActive) {
    throw new Error("The academic session is not active.");
  }

  if (!term.isActive) {
    throw new Error("The term is not active.");
  }

  if (date) {
    const assessmentDate = globalThis.Temporal.PlainDate.from(date);

    const termStart = globalThis.Temporal.PlainDate.from(
      term.startDate.toString().slice(0, 10),
    );

    const termEnd = globalThis.Temporal.PlainDate.from(
      term.endDate.toString().slice(0, 10),
    );

    if (
      globalThis.Temporal.PlainDate.compare(assessmentDate, termStart) < 0 ||
      globalThis.Temporal.PlainDate.compare(assessmentDate, termEnd) > 0
    ) {
      throw new Error("Assessment date must be within the active term.");
    }
  }

  const creator = await db.orm.public.User.where((user) =>
    user.id.eq(createdById),
  ).first();

  if (!creator || creator.schoolId !== schoolId || !creator.isActive) {
    throw new Error("Invalid assessment creator.");
  }

  const validatedCategoryId = await validateAssessmentCategory(
    schoolId,
    assessmentCategoryId,
    type,
  );

  return db.orm.public.Assessment.create({
    schoolId,
    classId,
    subjectId,
    termId,
    createdById,
    title: title.trim(),
    type,
    maxScore,
    weight,
    assessmentCategoryId: validatedCategoryId,
    date: date ? globalThis.Temporal.Instant.from(`${date}T00:00:00Z`) : null,
    description: description?.trim() || null,
  });
}

type GetAssessmentsInput = {
  schoolId: number;
  classId?: number;
  subjectId?: number;
  termId?: number;
  type?: AssessmentType;
  assessmentCategoryId?: number | null;
};

export async function getAssessments(input: GetAssessmentsInput) {
  const { schoolId, classId, subjectId, termId, type, assessmentCategoryId } =
    input;

  const assessments = await db.orm.public.Assessment.where((assessment) =>
    assessment.schoolId.eq(schoolId),
  ).all();

  return assessments.filter((assessment) => {
    if (classId !== undefined && assessment.classId !== classId) {
      return false;
    }

    if (subjectId !== undefined && assessment.subjectId !== subjectId) {
      return false;
    }

    if (termId !== undefined && assessment.termId !== termId) {
      return false;
    }

    if (type !== undefined && assessment.type !== type) {
      return false;
    }

    if (
      assessmentCategoryId !== undefined &&
      (assessment.assessmentCategoryId ?? null) !== assessmentCategoryId
    ) {
      return false;
    }

    return true;
  });
}

export async function getAssessmentById(
  schoolId: number,
  assessmentId: number,
) {
  const assessment = await db.orm.public.Assessment.where((assessment) =>
    assessment.id.eq(assessmentId),
  ).first();

  if (!assessment || assessment.schoolId !== schoolId) {
    throw new Error("Assessment not found.");
  }

  return assessment;
}

type UpdateAssessmentInput = {
  schoolId: number;
  assessmentId: number;
  classId?: number;
  subjectId?: number;
  termId?: number;
  title?: string;
  type?: AssessmentType;
  maxScore?: number;
  weight?: number;
  date?: string | null;
  description?: string | null;
  assessmentCategoryId?: number | null;
};

export async function updateAssessment(input: UpdateAssessmentInput) {
  const {
    schoolId,
    assessmentId,
    classId,
    subjectId,
    termId,
    title,
    type,
    maxScore,
    weight,
    date,
    description,
    assessmentCategoryId,
  } = input;

  const assessment = await db.orm.public.Assessment.where((assessment) =>
    assessment.id.eq(assessmentId),
  ).first();

  if (!assessment || assessment.schoolId !== schoolId) {
    throw new Error("Assessment not found.");
  }

  if (title !== undefined && !title.trim()) {
    throw new Error("Assessment title is required.");
  }

  if (maxScore !== undefined && (!Number.isFinite(maxScore) || maxScore <= 0)) {
    throw new Error("Maximum score must be a finite number greater than zero.");
  }

  if (weight !== undefined && (!Number.isFinite(weight) || weight <= 0)) {
    throw new Error(
      "Assessment weight must be a finite number greater than zero.",
    );
  }

  const newClassId = classId ?? assessment.classId;
  const newSubjectId = subjectId ?? assessment.subjectId;
  const newTermId = termId ?? assessment.termId;
  const newType = type ?? assessment.type;

  const newCategoryId = await validateAssessmentCategory(
    schoolId,
    assessmentCategoryId === undefined
      ? assessment.assessmentCategoryId
      : assessmentCategoryId,
    newType,
  );

  const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.id.eq(newClassId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    throw new Error("Invalid class.");
  }

  const subject = await db.orm.public.Subject.where((subject) =>
    subject.id.eq(newSubjectId),
  ).first();

  if (!subject || subject.schoolId !== schoolId) {
    throw new Error("Invalid subject.");
  }

  const classSubjects = await db.orm.public.ClassSubject.where((assignment) =>
    assignment.classId.eq(newClassId),
  ).all();

  const subjectAssigned = classSubjects.some(
    (assignment) => assignment.subjectId === newSubjectId,
  );

  if (!subjectAssigned) {
    throw new Error("This subject is not assigned to this class.");
  }

  const term = await db.orm.public.Term.where((term) =>
    term.id.eq(newTermId),
  ).first();

  if (!term) {
    throw new Error("Invalid term.");
  }

  const academicSession = await db.orm.public.AcademicSession.where((session) =>
    session.id.eq(term.sessionId),
  ).first();

  if (!academicSession || academicSession.schoolId !== schoolId) {
    throw new Error("Invalid academic session.");
  }

  if (!academicSession.isActive) {
    throw new Error("The academic session is not active.");
  }

  if (!term.isActive) {
    throw new Error("The term is not active.");
  }

  if (date) {
    const assessmentDate = globalThis.Temporal.PlainDate.from(date);

    const termStart = globalThis.Temporal.PlainDate.from(
      term.startDate.toString().slice(0, 10),
    );

    const termEnd = globalThis.Temporal.PlainDate.from(
      term.endDate.toString().slice(0, 10),
    );

    if (
      globalThis.Temporal.PlainDate.compare(assessmentDate, termStart) < 0 ||
      globalThis.Temporal.PlainDate.compare(assessmentDate, termEnd) > 0
    ) {
      throw new Error("Assessment date must be within the active term.");
    }
  }

  if (maxScore !== undefined) {
    const scores = await db.orm.public.AssessmentScore.where((score) =>
      score.assessmentId.eq(assessmentId),
    ).all();

    const highestScore = scores.reduce(
      (highest, score) => Math.max(highest, score.score),
      0,
    );

    if (maxScore < highestScore) {
      throw new Error(
        "Maximum score cannot be lower than an existing student score.",
      );
    }
  }

  return db.orm.public.Assessment.where((assessment) =>
    assessment.id.eq(assessmentId),
  ).update({
    classId: newClassId,
    subjectId: newSubjectId,
    termId: newTermId,
    title: title !== undefined ? title.trim() : assessment.title,
    type: newType,
    assessmentCategoryId: newCategoryId,
    maxScore: maxScore ?? assessment.maxScore,
    weight: weight ?? assessment.weight,
    date:
      date === undefined
        ? assessment.date
        : date === null
          ? null
          : globalThis.Temporal.Instant.from(`${date}T00:00:00Z`),
    description:
      description === undefined
        ? assessment.description
        : description?.trim() || null,
  });
}

export async function deleteAssessment(schoolId: number, assessmentId: number) {
  const assessment = await db.orm.public.Assessment.where((assessment) =>
    assessment.id.eq(assessmentId),
  ).first();

  if (!assessment || assessment.schoolId !== schoolId) {
    throw new Error("Assessment not found.");
  }

  const scores = await db.orm.public.AssessmentScore.where((score) =>
    score.assessmentId.eq(assessmentId),
  ).all();

  if (scores.length > 0) {
    throw new Error(
      "This assessment cannot be deleted because student scores have already been recorded.",
    );
  }

  return db.orm.public.Assessment.where((assessment) =>
    assessment.id.eq(assessmentId),
  ).delete();
}

type RecordAssessmentScoreInput = {
  schoolId: number;
  assessmentId: number;
  studentId: number;
  score: number;
  remarks?: string;
};

export async function recordAssessmentScore(
  input: RecordAssessmentScoreInput,
  client: DatabaseClient = db,
) {
  const { schoolId, assessmentId, studentId, score, remarks } = input;

  const assessment = await client.orm.public.Assessment.where((assessment) =>
    assessment.id.eq(assessmentId),
  ).first();

  if (!assessment || assessment.schoolId !== schoolId) {
    throw new Error("Assessment not found.");
  }

  const student = await client.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    throw new Error("Invalid student.");
  }

  if (!student.isActive) {
    throw new Error(
      "Assessment scores cannot be recorded for an inactive student.",
    );
  }

  if (student.classId !== assessment.classId) {
    throw new Error("Student is not assigned to this class.");
  }

  if (!Number.isFinite(score)) {
    throw new Error("Score must be a valid finite number.");
  }

  if (score < 0) {
    throw new Error("Score cannot be negative.");
  }

  if (!Number.isFinite(assessment.maxScore) || assessment.maxScore <= 0) {
    throw new Error("The assessment maximum score is invalid.");
  }

  if (score > assessment.maxScore) {
    throw new Error(
      `Score cannot be greater than the maximum score of ${assessment.maxScore}.`,
    );
  }

  /*
   * Save or update the assessment score first.
   */
  const existingScores = await client.orm.public.AssessmentScore.where(
    (scoreRecord) => scoreRecord.assessmentId.eq(assessmentId),
  ).all();

  const existingScore = existingScores.find(
    (scoreRecord) => scoreRecord.studentId === studentId,
  );

  let savedScore;

  if (existingScore) {
    savedScore = await client.orm.public.AssessmentScore.where((scoreRecord) =>
      scoreRecord.id.eq(existingScore.id),
    ).update({
      score,
      remarks: remarks?.trim() || null,
    });
  } else {
    savedScore = await client.orm.public.AssessmentScore.create({
      assessmentId,
      studentId,
      score,
      remarks: remarks?.trim() || null,
    });
  }

  /*
   * Recalculate only configurations that use this assessment type
   * and this exact assessment category.
   */
  const configurations = await client.orm.public.ReportConfiguration.where(
    (configuration) => configuration.schoolId.eq(schoolId),
  ).all();

  const activeConfigurations = configurations.filter(
    (configuration) => configuration.isActive,
  );

  for (const configuration of activeConfigurations) {
    const components = await client.orm.public.ReportComponent.where((component) =>
      component.configurationId.eq(configuration.id),
    ).all();

    const usesAssessmentComponent = components.some(
      (component) =>
        component.type === "ASSESSMENT" &&
        component.assessmentType === assessment.type &&
        (component.assessmentCategoryId ?? null) ===
          (assessment.assessmentCategoryId ?? null),
    );

    if (!usesAssessmentComponent) {
      continue;
    }

    
await calculateAndSaveSubjectResult(
  {
    schoolId,
    studentId,
    classId: assessment.classId,
    subjectId: assessment.subjectId,
    termId: assessment.termId,
    reportType: configuration.reportType,
  },
  client,
);

  }

  return savedScore;
}

export async function getAssessmentScores(
  schoolId: number,
  assessmentId: number,
) {
  const assessment = await db.orm.public.Assessment.where((assessment) =>
    assessment.id.eq(assessmentId),
  ).first();

  if (!assessment || assessment.schoolId !== schoolId) {
    throw new Error("Assessment not found.");
  }

  return db.orm.public.AssessmentScore.where((score) =>
    score.assessmentId.eq(assessmentId),
  ).all();
}

export async function getStudentAssessmentResults(
  schoolId: number,
  studentId: number,
  termId: number,
) {
  const student = await db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    throw new Error("Invalid student.");
  }

  if (!student.classId) {
    throw new Error("Student is not assigned to a class.");
  }

  const term = await db.orm.public.Term.where((term) =>
    term.id.eq(termId),
  ).first();

  if (!term) {
    throw new Error("Invalid term.");
  }

  const academicSession = await db.orm.public.AcademicSession.where((session) =>
    session.id.eq(term.sessionId),
  ).first();

  if (!academicSession || academicSession.schoolId !== schoolId) {
    throw new Error("Invalid academic session.");
  }

  const assessments = await db.orm.public.Assessment.where((assessment) =>
    assessment.termId.eq(termId),
  ).all();

  const studentAssessments = assessments.filter(
    (assessment) =>
      assessment.schoolId === schoolId &&
      assessment.classId === student.classId,
  );

  const results = [];

  for (const assessment of studentAssessments) {
    const scores = await db.orm.public.AssessmentScore.where((score) =>
      score.assessmentId.eq(assessment.id),
    ).all();

    const studentScore = scores.find((score) => score.studentId === studentId);

    results.push({
      assessment,
      score: studentScore ?? null,
    });
  }

  return results;
}
