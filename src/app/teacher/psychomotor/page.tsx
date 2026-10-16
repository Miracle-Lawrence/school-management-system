import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import {
  getActivePsychomotorFields,
  getActivePsychomotorRatingOptions,
  getStudentPsychomotorRatings,
  saveStudentPsychomotorRating,
} from "@/lib/services/psychomotor.service";
import { studentPsychomotorRatingSchema } from "@/lib/validation/psychomotor";
import { db } from "@/prisma/db";

type TeacherPsychomotorPageProps = {
  searchParams: Promise<{
    classId?: string;
    termId?: string;
    saved?: string;
  }>;
};

function parsePositiveInteger(value?: string): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export default async function TeacherPsychomotorPage({
  searchParams,
}: TeacherPsychomotorPageProps) {
  const session = await requireRole(["TEACHER"]);
  const schoolId = session.user.schoolId;
  const userId = Number(session.user.id);
  const params = await searchParams;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const classId = parsePositiveInteger(params.classId);
  const termId = parsePositiveInteger(params.termId);

  const teacher = await db.orm.public.Teacher.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Your teacher profile is not configured correctly. Please contact your
        school administrator.
      </main>
    );
  }

  const [
    allAssignments,
    schoolClasses,
    allTerms,
    sessions,
    fields,
    ratingOptions,
  ] = await Promise.all([
    db.orm.public.TeacherAssignment.where((item) =>
      item.teacherId.eq(teacher.id),
    ).all(),
    db.orm.public.SchoolClass.where((item) => item.schoolId.eq(schoolId)).all(),
    db.orm.public.Term.all(),
    db.orm.public.AcademicSession.where((item) =>
      item.schoolId.eq(schoolId),
    ).all(),
    getActivePsychomotorFields(schoolId),
    getActivePsychomotorRatingOptions(schoolId),
  ]);

  const assignments = allAssignments.filter(
    (item) => item.schoolId === schoolId,
  );

  const assignedClassIds = new Set(assignments.map((item) => item.classId));

  const classes = schoolClasses
    .filter((item) => assignedClassIds.has(item.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const sessionIds = new Set(sessions.map((item) => item.id));

  const terms = allTerms
    .filter((item) => sessionIds.has(item.sessionId))
    .sort((a, b) => {
      const sessionA =
        sessions.find((record) => record.id === a.sessionId)?.name ?? "";
      const sessionB =
        sessions.find((record) => record.id === b.sessionId)?.name ?? "";

      return sessionB.localeCompare(sessionA) || a.name.localeCompare(b.name);
    });

  const selectedClass = classes.find((item) => item.id === classId);
  const selectedTerm = terms.find((item) => item.id === termId);

  const students =
    selectedClass && selectedTerm
      ? (
          await db.orm.public.Student.where((item) =>
            item.schoolId.eq(schoolId),
          ).all()
        )
          .filter(
            (item) =>
              item.schoolId === schoolId &&
              item.classId === selectedClass.id &&
              item.isActive,
          )
          .sort(
            (a, b) =>
              a.lastName.localeCompare(b.lastName) ||
              a.firstName.localeCompare(b.firstName),
          )
      : [];

  const existingRatings =
    selectedClass && selectedTerm
      ? await Promise.all(
          students.map(async (student) => ({
            studentId: student.id,
            ratings: await getStudentPsychomotorRatings(
              schoolId,
              student.id,
              selectedTerm.id,
            ),
          })),
        )
      : [];

  const ratingMap = new Map<string, { ratingId: number; comment: string }>();

  for (const studentRatings of existingRatings) {
    for (const rating of studentRatings.ratings) {
      ratingMap.set(`${studentRatings.studentId}_${rating.fieldId}`, {
        ratingId: rating.ratingId,
        comment: rating.comment ?? "",
      });
    }
  }

  async function saveClassRatings(formData: FormData) {
    "use server";

    const currentSession = await requireRole(["TEACHER"]);
    const currentSchoolId = currentSession.user.schoolId;
    const currentUserId = Number(currentSession.user.id);

    if (!currentSchoolId) {
      throw new Error("School context is required.");
    }

    const submittedClassId = parsePositiveInteger(
      String(formData.get("classId") ?? ""),
    );
    const submittedTermId = parsePositiveInteger(
      String(formData.get("termId") ?? ""),
    );

    if (!submittedClassId || !submittedTermId) {
      throw new Error("Select a valid class and academic term.");
    }

    const currentTeacher = await db.orm.public.Teacher.where((item) =>
      item.userId.eq(currentUserId),
    ).first();

    if (!currentTeacher || currentTeacher.schoolId !== currentSchoolId) {
      throw new Error("Your teacher profile could not be verified.");
    }

    const [
      currentAssignments,
      selectedClassRecord,
      allCurrentTerms,
      currentSessions,
      currentStudents,
      currentFields,
      currentOptions,
    ] = await Promise.all([
      db.orm.public.TeacherAssignment.where((item) =>
        item.teacherId.eq(currentTeacher.id),
      ).all(),
      db.orm.public.SchoolClass.where((item) =>
        item.id.eq(submittedClassId),
      ).first(),
      db.orm.public.Term.all(),
      db.orm.public.AcademicSession.where((item) =>
        item.schoolId.eq(currentSchoolId),
      ).all(),
      db.orm.public.Student.where((item) =>
        item.schoolId.eq(currentSchoolId),
      ).all(),
      getActivePsychomotorFields(currentSchoolId),
      getActivePsychomotorRatingOptions(currentSchoolId),
    ]);

    const isAssigned = currentAssignments.some(
      (item) =>
        item.schoolId === currentSchoolId && item.classId === submittedClassId,
    );

    if (
      !isAssigned ||
      !selectedClassRecord ||
      selectedClassRecord.schoolId !== currentSchoolId
    ) {
      throw new Error("You are not assigned to this class.");
    }

    const validSessionIds = new Set(currentSessions.map((item) => item.id));

    const selectedTermRecord = allCurrentTerms.find(
      (item) =>
        item.id === submittedTermId && validSessionIds.has(item.sessionId),
    );

    if (!selectedTermRecord) {
      throw new Error("The selected term does not belong to your school.");
    }

    if (currentFields.length === 0 || currentOptions.length === 0) {
      throw new Error(
        "Your school must configure active psychomotor fields and rating options first.",
      );
    }

    const activeOptionIds = new Set(currentOptions.map((item) => item.id));

    const studentsToSave = currentStudents
      .filter(
        (item) =>
          item.schoolId === currentSchoolId &&
          item.classId === submittedClassId &&
          item.isActive,
      )
      .sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName) ||
          a.firstName.localeCompare(b.firstName),
      );

    // Load existing ratings so a blank comment doesn't erase a saved one.
    const existingRatingsByStudent = await Promise.all(
      studentsToSave.map(async (student) => ({
        studentId: student.id,
        ratings: await getStudentPsychomotorRatings(
          currentSchoolId,
          student.id,
          submittedTermId,
        ),
      })),
    );

    const existingRatingMap = new Map<
      string,
      { ratingId: number; comment: string }
    >();

    for (const item of existingRatingsByStudent) {
      for (const rating of item.ratings) {
        existingRatingMap.set(`${item.studentId}_${rating.fieldId}`, {
          ratingId: rating.ratingId,
          comment: rating.comment ?? "",
        });
      }
    }

    let savedCount = 0;

    for (const student of studentsToSave) {
      for (const field of currentFields) {
        const key = `${student.id}_${field.id}`;
        const rawRating = formData.get(`rating_${key}`);

        // A blank rating means leave this existing record untouched.
        if (typeof rawRating !== "string" || rawRating.trim() === "") {
          continue;
        }

        const ratingId = parsePositiveInteger(rawRating);

        if (!ratingId || !activeOptionIds.has(ratingId)) {
          throw new Error(
            `Invalid rating selected for ${student.firstName} ${student.lastName}.`,
          );
        }

        const rawComment = formData.get(`comment_${key}`);
        const submittedComment =
          typeof rawComment === "string" ? rawComment.trim() : "";

        const existing = existingRatingMap.get(key);

        // Keep an existing comment when the submitted comment is blank.
        const comment = submittedComment || existing?.comment || "";

        const parsed = studentPsychomotorRatingSchema.safeParse({
          studentId: student.id,
          termId: submittedTermId,
          fieldId: field.id,
          ratingId,
          comment,
        });

        if (!parsed.success) {
          throw new Error(
            `Invalid data for ${student.firstName} ${student.lastName}, ${field.name}.`,
          );
        }

        await saveStudentPsychomotorRating(currentSchoolId, parsed.data);

        savedCount += 1;
      }
    }

    redirect(
      `/teacher/psychomotor?classId=${submittedClassId}` +
        `&termId=${submittedTermId}&saved=${savedCount}`,
    );
  }

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Teaching and Learning
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Psychomotor Assessments
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Assess students against your school's configured psychomotor fields.
          You can work through the whole class in one table. Blank ratings leave
          existing records unchanged.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Select class and term
        </h2>

        <form
          method="GET"
          className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <label className="text-sm font-medium text-slate-700">
            Assigned class
            <select
              name="classId"
              defaultValue={classId?.toString() ?? ""}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
            >
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Academic term
            <select
              name="termId"
              defaultValue={termId?.toString() ?? ""}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
            >
              <option value="">Select term</option>
              {terms.map((item) => {
                const academicSession = sessions.find(
                  (record) => record.id === item.sessionId,
                );

                return (
                  <option key={item.id} value={item.id}>
                    {item.name} — {academicSession?.name ?? "Academic session"}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Load students
            </button>
          </div>
        </form>
      </section>

      {params.saved !== undefined && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Saved {Number(params.saved)} student-field rating(s). Blank ratings
          were left unchanged.
        </div>
      )}

      {fields.length === 0 || ratingOptions.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          Your school has not configured active psychomotor fields and rating
          options. Please ask the school administrator to configure them before
          entering assessments.
        </div>
      ) : selectedClass && selectedTerm ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedClass.name} — {selectedTerm.name}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {students.length} active student(s) · {fields.length} assessment
              field(s)
            </p>
          </div>

          {students.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-600">
              No active students were found in this class.
            </div>
          ) : (
            <form action={saveClassRatings}>
              <input type="hidden" name="classId" value={selectedClass.id} />
              <input type="hidden" name="termId" value={selectedTerm.id} />

              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="sticky top-0 z-20 border-b border-slate-200 bg-slate-100 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Student
                      </th>
                      {fields.map((field) => (
                        <th
                          key={field.id}
                          className="min-w-64 px-4 py-3 font-semibold text-slate-600"
                        >
                          {field.name}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr key={student.id} className="align-top">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">
                            {student.lastName}, {student.firstName}
                          </p>
                        </td>

                        {fields.map((field) => {
                          const key = `${student.id}_${field.id}`;
                          const existing = ratingMap.get(key);

                          return (
                            <td key={field.id} className="px-4 py-3">
                              <label className="block text-xs font-medium text-slate-600">
                                Rating
                                <select
                                  name={`rating_${key}`}
                                  defaultValue={
                                    existing?.ratingId.toString() ?? ""
                                  }
                                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                                >
                                  <option value="">Leave unchanged</option>
                                  {ratingOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label className="mt-3 block text-xs font-medium text-slate-600">
                                Comment (optional)
                                <textarea
                                  name={`comment_${key}`}
                                  defaultValue={existing?.comment ?? ""}
                                  rows={2}
                                  maxLength={500}
                                  placeholder="Optional note"
                                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
                                />
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-xs leading-5 text-slate-600">
                  Choose a rating to save or update that field. Leaving a rating
                  blank skips it and preserves its existing record.
                </p>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Save class assessments
                </button>
              </div>
            </form>
          )}
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <h2 className="font-semibold text-slate-800">
            Select a class and term
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Choose your assigned class and academic term, then select Load
            students to assess the whole class.
          </p>
        </div>
      )}

      <Link
        href="/teacher/dashboard"
        className="inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900"
      >
        ← Back to teacher dashboard
      </Link>
    </main>
  );
}
