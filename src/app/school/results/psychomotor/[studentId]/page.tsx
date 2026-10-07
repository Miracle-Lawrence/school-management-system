import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { db } from "@/prisma/db";
import { requireRole } from "@/lib/auth/authorization";
import {
  getActivePsychomotorFields,
  getActivePsychomotorRatingOptions,
  getStudentPsychomotorRatings,
  saveStudentPsychomotorRating,
} from "@/lib/services/psychomotor.service";
import { studentPsychomotorRatingSchema } from "@/lib/validation/psychomotor";

type PageProps = {
  params: Promise<{
    studentId: string;
  }>;
  searchParams: Promise<{
    termId?: string;
    classId?: string;
  }>;
};

export default async function StudentPsychomotorPage({
  params,
  searchParams,
}: PageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const { studentId: studentIdParam } = await params;
  const { termId: termIdParam, classId: classIdParam } = await searchParams;

  const studentId = Number(studentIdParam);
  const termId = Number(termIdParam);
  const classId = Number(classIdParam);

  if (
    !Number.isInteger(studentId) ||
    !Number.isInteger(termId) ||
    !Number.isInteger(classId) ||
    studentId <= 0 ||
    termId <= 0 ||
    classId <= 0
  ) {
    notFound();
  }

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School ID is missing from the session.");
  }

  // Load the student by ID, then verify school/class ownership in JavaScript.
  // This avoids the known ORM issue with compound where conditions.
  const student = await db.orm.public.Student.where((item) =>
    item.id.eq(studentId),
  ).first();

  if (
    !student ||
    student.schoolId !== schoolId ||
    student.classId !== classId
  ) {
    notFound();
  }

  // Load the class and verify school ownership.
  const schoolClass = await db.orm.public.SchoolClass.where((item) =>
    item.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    notFound();
  }

  // Load the term and verify school ownership.
const term = await db.orm.public.Term.where((item) =>
  item.id.eq(termId),
).first();

if (!term) {
  notFound();
}

const academicSession = await db.orm.public.AcademicSession.where((item) =>
  item.id.eq(term.sessionId),
).first();

if (!academicSession || academicSession.schoolId !== schoolId) {
  notFound();
}

  // Load the active psychomotor configuration.
  const [fields, ratingOptions, existingRatings] = await Promise.all([
    getActivePsychomotorFields(schoolId),
    getActivePsychomotorRatingOptions(schoolId),
    getStudentPsychomotorRatings(schoolId, studentId, termId),
  ]);

  const existingRatingMap = new Map(
    existingRatings.map((rating) => [rating.fieldId, rating]),
  );

  async function saveRatings(formData: FormData) {
    "use server";

    const currentSession = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const currentSchoolId = currentSession.user.schoolId;

    if (!currentSchoolId) {
      throw new Error("School ID is missing from the session.");
    }

    // Verify the student again on the server action.
    const currentStudent = await db.orm.public.Student.where((item) =>
      item.id.eq(studentId),
    ).first();

    if (
      !currentStudent ||
      currentStudent.schoolId !== currentSchoolId ||
      currentStudent.classId !== classId
    ) {
      throw new Error("Invalid student.");
    }

    // Verify the term again.
    const currentTerm = await db.orm.public.Term.where((item) =>
      item.id.eq(termId),
    ).first();

    if (!currentTerm) {
      throw new Error("Invalid term.");
    }

    const currentAcademicSession = await db.orm.public.AcademicSession.where(
      (item) => item.id.eq(currentTerm.sessionId),
    ).first();

    if (
      !currentAcademicSession ||
      currentAcademicSession.schoolId !== currentSchoolId
    ) {
      throw new Error("Invalid term.");
    }

    // Reload active configuration inside the server action so the
    // submitted values are validated against the current database state.
    const [currentFields, currentRatingOptions] = await Promise.all([
      getActivePsychomotorFields(currentSchoolId),
      getActivePsychomotorRatingOptions(currentSchoolId),
    ]);

    if (currentFields.length === 0) {
      throw new Error("No active psychomotor fields are configured.");
    }

    if (currentRatingOptions.length === 0) {
      throw new Error("No active psychomotor rating options are configured.");
    }

    const activeRatingIds = new Set(
      currentRatingOptions.map((option) => option.id),
    );

    // Require every active field to have a rating.
    for (const field of currentFields) {
      const rawRatingId = formData.get(`rating_${field.id}`);

      if (!rawRatingId) {
        throw new Error(`Please select a rating for ${field.name}.`);
      }

      const ratingId = Number(rawRatingId);

      if (!Number.isInteger(ratingId) || !activeRatingIds.has(ratingId)) {
        throw new Error(`Invalid rating selected for ${field.name}.`);
      }
    }

    // Save each field rating.
    for (const field of currentFields) {
      const rawRatingId = formData.get(`rating_${field.id}`);
      const rawComment = formData.get(`comment_${field.id}`);

      const ratingId = Number(rawRatingId);

      const comment = typeof rawComment === "string" ? rawComment.trim() : "";

      const parsed = studentPsychomotorRatingSchema.safeParse({
        studentId,
        termId,
        fieldId: field.id,
        ratingId,
        comment,
      });

      if (!parsed.success) {
        throw new Error(`Invalid rating data for ${field.name}.`);
      }

      await saveStudentPsychomotorRating(currentSchoolId, parsed.data);
    }

    redirect(`/school/results/psychomotor?termId=${termId}&classId=${classId}`);
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2">
            <Link
              href={`/school/results/psychomotor?termId=${termId}&classId=${classId}`}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              ← Back to Students
            </Link>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            Psychomotor Assessment
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Enter psychomotor and behavioural ratings for this student.
          </p>
        </div>
      </div>

      {/* Student information */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Student
            </p>
            <p className="mt-1 font-semibold text-gray-900">
              {student.firstName} {student.lastName}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Admission Number
            </p>
            <p className="mt-1 font-semibold text-gray-900">
              {student.admissionNumber}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Class
            </p>
            <p className="mt-1 font-semibold text-gray-900">
              {schoolClass.name}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Term
            </p>
            <p className="mt-1 font-semibold text-gray-900">{term.name}</p>
          </div>
        </div>
      </section>

      {/* Assessment form */}
      <form action={saveRatings} className="space-y-6">
        <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="border-b bg-gray-50 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Psychomotor & Behavioural Ratings
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Select a rating for each assessment area. Comments are optional.
            </p>
          </div>

          <div className="divide-y">
            {fields.map((field, index) => {
              const existingRating = existingRatingMap.get(field.id);

              return (
                <div key={field.id} className="p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                      {index + 1}
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {field.name}
                      </h3>

                      {field.description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {field.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`rating_${field.id}`}
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Rating
                      </label>

                      <select
                        id={`rating_${field.id}`}
                        name={`rating_${field.id}`}
                        defaultValue={
                          existingRating?.ratingId?.toString() ?? ""
                        }
                        required
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="">Select rating</option>

                        {ratingOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`comment_${field.id}`}
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Comment
                      </label>

                      <input
                        id={`comment_${field.id}`}
                        name={`comment_${field.id}`}
                        type="text"
                        maxLength={500}
                        defaultValue={existingRating?.comment ?? ""}
                        placeholder="Optional comment"
                        className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href={`/school/results/psychomotor?termId=${termId}&classId=${classId}`}
            className="rounded-md border border-gray-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Save Ratings
          </button>
        </div>
      </form>
    </main>
  );
}
