import { db } from "@/prisma/db";

type CreateAssignmentInput = {
  schoolId: number;
  teacherId: number;
  classId: number;
  subjectId: number;
  title: string;
  instructions: string;
  dueDate?: string | null;
  maxScore: number;
  isPublished?: boolean;
};

type GetTeacherAssignmentsInput = {
  schoolId: number;
  teacherId: number;
};

function validatePositiveInteger(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid ${field}.`);
  }
}

export async function createAssignment(input: CreateAssignmentInput) {
  const {
    schoolId,
    teacherId,
    classId,
    subjectId,
    title,
    instructions,
    dueDate,
    maxScore,
    isPublished = false,
  } = input;

  validatePositiveInteger(schoolId, "school");
  validatePositiveInteger(teacherId, "teacher");
  validatePositiveInteger(classId, "class");
  validatePositiveInteger(subjectId, "subject");

  if (!title.trim()) {
    throw new Error("Assignment title is required.");
  }

  if (title.trim().length > 200) {
    throw new Error("Assignment title cannot exceed 200 characters.");
  }

  if (!instructions.trim()) {
    throw new Error("Assignment instructions are required.");
  }

  if (!Number.isFinite(maxScore) || maxScore <= 0) {
    throw new Error(
      "Maximum score must be a finite number greater than zero.",
    );
  }

  const [teacher, schoolClass, subject] = await Promise.all([
    db.orm.public.Teacher.where((item) =>
      item.id.eq(teacherId),
    ).first(),

    db.orm.public.SchoolClass.where((item) =>
      item.id.eq(classId),
    ).first(),

    db.orm.public.Subject.where((item) =>
      item.id.eq(subjectId),
    ).first(),
  ]);

  if (!teacher || teacher.schoolId !== schoolId) {
    throw new Error("Invalid teacher.");
  }

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    throw new Error("Invalid class.");
  }

  if (!subject || subject.schoolId !== schoolId) {
    throw new Error("Invalid subject.");
  }

  const teacherAssignments =
    await db.orm.public.TeacherAssignment.where((item) =>
      item.teacherId.eq(teacherId),
    ).all();

  const isAssigned = teacherAssignments.some(
    (item) =>
      item.schoolId === schoolId &&
      item.classId === classId &&
      item.subjectId === subjectId,
  );

  if (!isAssigned) {
    throw new Error(
      "You are not assigned to teach this class and subject.",
    );
  }

  const classSubjects = await db.orm.public.ClassSubject.where((item) =>
    item.classId.eq(classId),
  ).all();

  if (
    !classSubjects.some(
      (item) =>
        item.schoolId === schoolId &&
        item.subjectId === subjectId,
    )
  ) {
    throw new Error("This subject is not assigned to the selected class.");
  }

  let parsedDueDate = null;

  if (dueDate) {
    try {
      parsedDueDate = globalThis.Temporal.Instant.from(dueDate);
    } catch {
      throw new Error("Please provide a valid assignment deadline.");
    }
  }

  const published = Boolean(isPublished);

  return db.orm.public.Assignment.create({
    schoolId,
    teacherId,
    classId,
    subjectId,
    title: title.trim(),
    instructions: instructions.trim(),
    dueDate: parsedDueDate,
    maxScore,
    isPublished: published,
    publishedAt: published ? new Date().toISOString() : null,
  });
}

export async function getTeacherAssignments(
  input: GetTeacherAssignmentsInput,
) {
  const { schoolId, teacherId } = input;

  validatePositiveInteger(schoolId, "school");
  validatePositiveInteger(teacherId, "teacher");

  const teacher = await db.orm.public.Teacher.where((item) =>
    item.id.eq(teacherId),
  ).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    throw new Error("Invalid teacher.");
  }

  const assignments = await db.orm.public.Assignment.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  return assignments
    .filter((item) => item.teacherId === teacherId)
    .sort((a, b) => {
      const dateA = a.createdAt
        ? new Date(a.createdAt.toString()).getTime()
        : 0;

      const dateB = b.createdAt
        ? new Date(b.createdAt.toString()).getTime()
        : 0;

      return dateB - dateA;
    });
}

