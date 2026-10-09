import { db } from "@/prisma/db";

import {
  getActivePsychomotorFields,
  getStudentPsychomotorRatings,
} from "@/lib/services/psychomotor.service";

import { getReportComment } from "@/lib/services/report-comment.service";

type ReportType = "MID_TERM" | "TERMINAL";

export async function getStudentReportCardData(
  schoolId: number,
  studentId: number,
  classId: number,
  termId: number,
  reportType: ReportType = "TERMINAL",
) {
  /*
   * ---------------------------------------------------------
   * 1. Validate school
   * ---------------------------------------------------------
   */

  const school = await db.orm.public.School.where((item) =>
    item.id.eq(schoolId),
  ).first();

  if (!school) {
    throw new Error("School not found.");
  }

  /*
   * ---------------------------------------------------------
   * 2. Validate student
   * ---------------------------------------------------------
   */

  const student = await db.orm.public.Student.where((item) =>
    item.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    throw new Error("Invalid student.");
  }

  /*
   * ---------------------------------------------------------
   * 3. Validate class
   * ---------------------------------------------------------
   */

  const schoolClass = await db.orm.public.SchoolClass.where((item) =>
    item.id.eq(classId),
  ).first();

  if (!schoolClass || schoolClass.schoolId !== schoolId) {
    throw new Error("Invalid class.");
  }

  /*
   * ---------------------------------------------------------
   * 4. Validate term and school session
   * ---------------------------------------------------------
   */

  const term = await db.orm.public.Term.where((item) =>
    item.id.eq(termId),
  ).first();

  if (!term) {
    throw new Error("Term not found.");
  }

  const academicSession = await db.orm.public.AcademicSession.where((item) =>
    item.id.eq(term.sessionId),
  ).first();

  if (!academicSession || academicSession.schoolId !== schoolId) {
    throw new Error("Invalid term.");
  }

  /*
   * ---------------------------------------------------------
   * 5. Get student's overall term result
   * ---------------------------------------------------------
   */

  const allStudentTermResults = await db.orm.public.StudentTermResult.where(
    (item) => item.studentId.eq(studentId),
  ).all();

  const studentTermResult =
    allStudentTermResults.find(
      (result) =>
        result.schoolId === schoolId &&
        result.classId === classId &&
        result.termId === termId &&
        result.reportType === reportType,
    ) ?? null;

  if (!studentTermResult) {
    throw new Error("No completed term result exists for this student.");
  }
  
  const classTeacher = studentTermResult.classTeacherId
    ? await db.orm.public.Teacher.where((teacher) =>
        teacher.id.eq(studentTermResult.classTeacherId!),
      ).first()
    : null;
  /*
   * ---------------------------------------------------------
   * 6. Get class subjects
   * ---------------------------------------------------------
   */

  const classSubjects = await db.orm.public.ClassSubject.where((item) =>
    item.classId.eq(classId),
  ).all();

  /*
   * ---------------------------------------------------------
   * 7. Get school subjects
   * ---------------------------------------------------------
   */

  const subjects = await db.orm.public.Subject.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  /*
   * ---------------------------------------------------------
   * 8. Get report configuration
   * ---------------------------------------------------------
   */

  const configurations = await db.orm.public.ReportConfiguration.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const reportConfiguration =
    configurations.find(
      (configuration) =>
        configuration.reportType === reportType && configuration.isActive,
    ) ?? null;

  if (!reportConfiguration) {
    throw new Error(
      "No active report configuration exists for this report type.",
    );
  }

  /*
   * ---------------------------------------------------------
   * 9. Get report components
   * ---------------------------------------------------------
   */

  const reportComponents = await db.orm.public.ReportComponent.where((item) =>
    item.configurationId.eq(reportConfiguration.id),
  ).all();

  const sortedReportComponents = [...reportComponents].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  /*
   * ---------------------------------------------------------
   * 10. Get student's subject results
   * ---------------------------------------------------------
   */

  const allSubjectResults = await db.orm.public.SubjectResult.where((item) =>
    item.studentId.eq(studentId),
  ).all();

  const subjectResults = allSubjectResults.filter(
    (result) =>
      result.schoolId === schoolId &&
      result.classId === classId &&
      result.termId === termId &&
      result.reportType === reportType,
  );

  /*
   * ---------------------------------------------------------
   * 11. Get component scores
   * ---------------------------------------------------------
   */

  const allComponentScores = await db.orm.public.ResultComponentScore.all();

  /*
   * ---------------------------------------------------------
   * 12. Build academic subject rows
   * ---------------------------------------------------------
   */

  const academicResults = classSubjects
    .map((classSubject) => {
      const subject = subjects.find(
        (item) => item.id === classSubject.subjectId,
      );

      const subjectResult = subjectResults.find(
        (result) => result.subjectId === classSubject.subjectId,
      );

      if (!subject || !subjectResult) {
        return null;
      }

      const componentScores = allComponentScores
        .filter((score) => score.subjectResultId === subjectResult.id)
        .map((score) => {
          const component = sortedReportComponents.find(
            (item) => item.id === score.componentId,
          );

          return {
            componentId: score.componentId,
            componentName: component?.name ?? "Component",
            score: score.score,
            maxScore: score.maxScore,
            displayOrder: component?.displayOrder ?? 999,
            isVisible: component?.isVisible ?? true,
          };
        })
        .filter((component) => component.isVisible)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectResultId: subjectResult.id,
        components: componentScores,
        totalScore: subjectResult.totalScore,
        percentageScore: subjectResult.percentageScore,
        grade: subjectResult.grade,
        remark: subjectResult.remark,
      };
    })
    .filter((result): result is NonNullable<typeof result> => result !== null);

  /*
   * ---------------------------------------------------------
   * 13. Get class average
   * ---------------------------------------------------------
   */

  const allClassTermResults = await db.orm.public.StudentTermResult.where(
    (item) => item.schoolId.eq(schoolId),
  ).all();

  const classTermResults = allClassTermResults.filter(
    (result) =>
      result.classId === classId &&
      result.termId === termId &&
      result.reportType === reportType,
  );

  const classAverage =
    classTermResults.length > 0
      ? Math.round(
          (classTermResults.reduce(
            (total, result) => total + result.averageScore,
            0,
          ) /
            classTermResults.length +
            Number.EPSILON) *
            100,
        ) / 100
      : null;

  /*
   * ---------------------------------------------------------
   * 14. Get psychomotor data
   * ---------------------------------------------------------
   */

  const psychomotorFields = await getActivePsychomotorFields(schoolId);

  const psychomotorRatings = await getStudentPsychomotorRatings(
    schoolId,
    studentId,
    termId,
  );

  const psychomotorRatingOptions =
    await db.orm.public.PsychomotorRatingOption.where((item) =>
      item.schoolId.eq(schoolId),
    ).all();

  const psychomotor = psychomotorFields.map((field) => {
    const rating = psychomotorRatings.find((item) => item.fieldId === field.id);

    const ratingOption = psychomotorRatingOptions.find(
      (option) => option.id === rating?.ratingId,
    );

    return {
      fieldId: field.id,
      fieldName: field.name,
      description: field.description,
      ratingId: rating?.ratingId ?? null,
      ratingLabel: ratingOption?.label ?? null,
      ratingValue: ratingOption?.value ?? null,
      comment: rating?.comment ?? null,
    };
  });

  /*
   * ---------------------------------------------------------
   * 15. Get attendance data
   * ---------------------------------------------------------
   */

  const allAttendanceRecords = await db.orm.public.Attendance.where((item) =>
    item.studentId.eq(studentId),
  ).all();

  const attendanceRecords = allAttendanceRecords.filter(
    (record) =>
      record.schoolId === schoolId &&
      record.classId === classId &&
      record.termId === termId,
  );

  const attendance = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter((record) => record.status === "PRESENT")
      .length,
    absent: attendanceRecords.filter((record) => record.status === "ABSENT")
      .length,
    late: attendanceRecords.filter((record) => record.status === "LATE").length,
    excused: attendanceRecords.filter((record) => record.status === "EXCUSED")
      .length,
  };

  /*
   * ---------------------------------------------------------
   * 16. Get teacher and principal comments
   * ---------------------------------------------------------
   */

  const reportComment = await getReportComment(
    schoolId,
    studentId,
    termId,
    reportType,
  );

  /*
   * ---------------------------------------------------------
   * 17. Return complete report-card data
   * ---------------------------------------------------------
   */

  return {
    school,
    academicSession,
    term,
    schoolClass,
    student,
    classTeacher,

    reportConfiguration: {
      id: reportConfiguration.id,
      name: reportConfiguration.name,
      reportType: reportConfiguration.reportType,
      showClassPosition: reportConfiguration.showClassPosition,
      showClassTeacherName: reportConfiguration.showClassTeacherName,
      showPrincipalSignature: reportConfiguration.showPrincipalSignature,
      showSchoolStamp: reportConfiguration.showSchoolStamp,
      showAttendance: reportConfiguration.showAttendance,
    },

    academic: {
      subjects: academicResults,
      totalScore: studentTermResult.totalScore,
      averageScore: studentTermResult.averageScore,
      grade: studentTermResult.grade,
      remark: studentTermResult.remark,
      position: studentTermResult.position,
      classSize: classTermResults.length,
      classAverage,
    },

    psychomotor,

    attendance,

    comments: {
      teacherComment: reportComment?.teacherComment ?? null,
      principalComment: reportComment?.principalComment ?? null,
    },
  };
}
