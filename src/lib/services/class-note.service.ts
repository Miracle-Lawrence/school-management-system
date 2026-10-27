import { db } from "@/prisma/db";

type CreateClassNoteInput = {
  schoolId: number;
  teacherId: number;
  classId: number;
  subjectId: number;
  title: string;
  content: string;
  isPublished?: boolean;
};

type GetTeacherClassNotesInput = {
  schoolId: number;
  teacherId: number;
};

function validatePositiveInteger(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid ${field}.`);
  }
}

export async function createClassNote(input: CreateClassNoteInput) {
  const {
    schoolId,
    teacherId,
    classId,
    subjectId,
    title,
    content,
    isPublished = false,
  } = input;

  validatePositiveInteger(schoolId, "school");
  validatePositiveInteger(teacherId, "teacher");
  validatePositiveInteger(classId, "class");
  validatePositiveInteger(subjectId, "subject");

  if (!title.trim()) {
    throw new Error("Class note title is required.");
  }

  if (title.trim().length > 200) {
    throw new Error("Class note title cannot exceed 200 characters.");
  }

  if (!content.trim()) {
    throw new Error("Class note content is required.");
  }

  if (content.length > 100000) {
    throw new Error("Class note content cannot exceed 100,000 characters.");
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

  const published = Boolean(isPublished);

  return db.orm.public.ClassNote.create({
    schoolId,
    teacherId,
    classId,
    subjectId,
    title: title.trim(),
    content: content.trim(),
    isPublished: published,
    publishedAt: published ? new Date().toISOString() : null,
  });
}

export async function getTeacherClassNotes(
  input: GetTeacherClassNotesInput,
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

  const notes = await db.orm.public.ClassNote.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  return notes
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
