import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/prisma/db";
import { requireRole } from "@/lib/auth/authorization";
import { getStudentReportCardData } from "@/lib/services/report-card.service";

import PrintButton from "./print-button";

type SearchParams = {
  sessionId?: string;
  termId?: string;
  classId?: string;
  studentId?: string;
};

type ReportCardPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ReportCardPage({
  searchParams,
}: ReportCardPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    redirect("/school/results");
  }

  const params = await searchParams;

  const [sessions, classes] = await Promise.all([
    db.orm.public.AcademicSession.where((item) =>
      item.schoolId.eq(schoolId),
    ).all(),

    db.orm.public.SchoolClass.where((item) => item.schoolId.eq(schoolId)).all(),
  ]);

  const sortedSessions = [...sessions].sort((a, b) =>
    b.startDate.toString().localeCompare(a.startDate.toString()),
  );

  const selectedSessionId = Number(params.sessionId) || sortedSessions[0]?.id;

  const terms = selectedSessionId
    ? await db.orm.public.Term.where((item) =>
        item.sessionId.eq(selectedSessionId),
      ).all()
    : [];

  const selectedTermId = Number(params.termId) || terms[0]?.id;

  const sortedClasses = [...classes].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const selectedClassId = Number(params.classId) || sortedClasses[0]?.id;

  const students = selectedClassId
    ? await db.orm.public.Student.where((item) =>
        item.schoolId.eq(schoolId),
      ).all()
    : [];

  const historicalTermResults =
    selectedClassId && selectedTermId
      ? await db.orm.public.StudentTermResult.where((item) =>
          item.studentId.gt(0),
        ).all()
      : [];

  const historicalStudentIds = new Set(
    historicalTermResults
      .filter(
        (result) =>
          result.schoolId === schoolId &&
          result.classId === selectedClassId &&
          result.termId === selectedTermId &&
          result.reportType === "TERMINAL",
      )
      .map((result) => result.studentId),
  );

  const classStudents = students
    .filter((student) => historicalStudentIds.has(student.id))
    .sort((a, b) => a.lastName.localeCompare(b.lastName));

  const selectedStudentId = Number(params.studentId) || classStudents[0]?.id;

  const selectedStudent = classStudents.find(
    (student) => student.id === selectedStudentId,
  );

  let reportCardData = null;

  if (selectedStudent && selectedTermId && selectedClassId) {
    try {
      reportCardData = await getStudentReportCardData(
        schoolId,
        selectedStudent.id,
        selectedClassId,
        selectedTermId,
        "TERMINAL",
      );
    } catch {
      reportCardData = null;
    }
  }

  /*
   * Load the school's active grading scale so the report card displays
   * the actual configured grading key rather than hard-coded values.
   */
  const gradeScales = await db.orm.public.GradeScale.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const activeGradeScales = [...gradeScales]
    .filter((scale) => scale.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const school = reportCardData?.school;
  const student = reportCardData?.student;
  const academic = reportCardData?.academic;

 const classSize = academic?.classSize ?? classStudents.length;

  const primaryColor = school?.primaryColor || "#1e3a8a";

  const secondaryColor = school?.secondaryColor || "#334155";

  const accentColor = school?.accentColor || primaryColor;

  const academicSubjects = academic?.subjects ?? [];

  /*
   * Build the academic report columns from the active report
   * configuration instead of assuming CA and Examination.
   *
   * Only visible components are displayed and they follow the
   * configured display order.
   */
  const reportComponents = [...(academicSubjects[0]?.components ?? [])]
    .filter((component) => component.isVisible)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const selectedTerm = terms.find((term) => term.id === selectedTermId);

  const selectedClass = sortedClasses.find(
    (schoolClass) => schoolClass.id === selectedClassId,
  );

  const classTeacher = reportCardData?.classTeacher ?? null;

  return (
    <>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        @media print {
          html,
          body {
            background: #ffffff !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-hidden {
            display: none !important;
          }

          .report-page-wrapper {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .report-sheet {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          .report-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          table {
            break-inside: auto;
            page-break-inside: auto;
          }

          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .signature-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }

        @media screen {
          .report-page-wrapper {
            background: #f1f5f9;
            padding: 2rem;
          }

          .report-sheet {
            max-width: 794px;
            margin: 0 auto;
          }
        }
      `}</style>

      <div className="report-page-wrapper min-h-screen">
        {/* ================================
            SCREEN-ONLY CONTROLS
        ================================= */}

        <div className="print-hidden mx-auto mb-6 max-w-5xl">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                Academic Management
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Terminal Report Card
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Select a student and print or save the report as PDF.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/school/results"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back to Results
              </Link>

              <Link
                href="/school/results/report-card/comments"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Report Comments
              </Link>

              {reportCardData && (
                <div
                  style={{
                    backgroundColor: primaryColor,
                  }}
                  className="inline-flex overflow-hidden rounded-lg"
                >
                  <PrintButton />
                </div>
              )}
            </div>
          </div>

          {/* Student selector */}
          <form
            method="GET"
            className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label
                  htmlFor="sessionId"
                  className="text-sm font-medium text-slate-700"
                >
                  Academic Session
                </label>

                <select
                  id="sessionId"
                  name="sessionId"
                  defaultValue={selectedSessionId ?? ""}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sortedSessions.map((academicSession) => (
                    <option key={academicSession.id} value={academicSession.id}>
                      {academicSession.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="termId"
                  className="text-sm font-medium text-slate-700"
                >
                  Term
                </label>

                <select
                  id="termId"
                  name="termId"
                  defaultValue={selectedTermId ?? ""}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="classId"
                  className="text-sm font-medium text-slate-700"
                >
                  Class
                </label>

                <select
                  id="classId"
                  name="classId"
                  defaultValue={selectedClassId ?? ""}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sortedClasses.map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="studentId"
                  className="text-sm font-medium text-slate-700"
                >
                  Student
                </label>

                <select
                  key={`student-selector-${selectedStudentId}`}
                  id="studentId"
                  name="studentId"
                  defaultValue={selectedStudentId ?? ""}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {classStudents.map((classStudent) => (
                    <option key={classStudent.id} value={classStudent.id}>
                      {classStudent.firstName} {classStudent.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Load Report Card
              </button>
            </div>
          </form>
        </div>

        {/* ================================
            REPORT SHEET
        ================================= */}

        {selectedStudent &&
        selectedTermId &&
        selectedClassId &&
        reportCardData &&
        school &&
        student &&
        academic ? (
          <main
            className="report-sheet overflow-hidden border border-slate-300 bg-white text-slate-900 shadow-xl"
            style={{
              borderTopWidth: "6px",
              borderTopColor: primaryColor,
            }}
          >
            {/* ================================
                SCHOOL HEADER
            ================================= */}

            <section
              className="report-section border-b-2 px-7 py-6"
              style={{
                borderBottomColor: primaryColor,
              }}
            >
              <div className="grid grid-cols-[90px_1fr_90px] items-center gap-4">
                {/* School Logo */}
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 bg-white p-1">
                  {school.logoUrl ? (
                    <img
                      src={school.logoUrl}
                      alt={`${school.name} logo`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{
                        backgroundColor: primaryColor,
                      }}
                    >
                      LOGO
                    </div>
                  )}
                </div>

                {/* School Identity */}
                <div className="text-center">
                  <p
                    className="text-xs font-bold uppercase tracking-[0.2em]"
                    style={{ color: secondaryColor }}
                  >
                    Official School Report
                  </p>

                  <h1
                    className="mt-1 text-2xl font-black uppercase tracking-tight sm:text-3xl"
                    style={{ color: primaryColor }}
                  >
                    {school.name}
                  </h1>

                  {school.motto && (
                    <p className="mt-1 text-sm font-semibold italic text-slate-600">
                      "{school.motto}"
                    </p>
                  )}

                  <div className="mt-2 space-y-0.5 text-xs text-slate-600">
                    {school.address && <p>{school.address}</p>}

                    {(school.city || school.state || school.country) && (
                      <p>
                        {[school.city, school.state, school.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}

                    {school.phone && (
                      <p>
                        Tel: <span className="font-medium">{school.phone}</span>
                      </p>
                    )}

                    {school.website && <p>{school.website}</p>}
                  </div>
                </div>

                {/* Student Passport */}
                <div className="flex justify-end">
                  <div className="h-24 w-20 overflow-hidden border-2 border-slate-400 bg-slate-100">
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt={`${student.firstName} ${student.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-center text-[10px] font-medium text-slate-500">
                        PASSPORT
                        <br />
                        PHOTO
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                className="mx-auto mt-5 w-fit border-y-2 px-8 py-2 text-center"
                style={{
                  borderColor: primaryColor,
                }}
              >
                <h2
                  className="text-lg font-black uppercase tracking-[0.12em]"
                  style={{ color: primaryColor }}
                >
                  Terminal Report Sheet
                </h2>

                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Academic Performance Report
                </p>
              </div>
            </section>

            {/* ================================
                STUDENT INFORMATION
            ================================= */}

            <section className="report-section px-7 py-5">
              <div className="grid grid-cols-2 border border-slate-300 text-sm sm:grid-cols-3 lg:grid-cols-6">
                <div className="border-b border-r border-slate-300 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Student Name
                  </p>

                  <p className="mt-1 font-bold">
                    {student.firstName}{" "}
                    {student.middleName ? `${student.middleName} ` : ""}
                    {student.lastName}
                  </p>
                </div>

                <div className="border-b border-r border-slate-300 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Admission No.
                  </p>

                  <p className="mt-1 font-bold">{student.admissionNumber}</p>
                </div>

                <div className="border-b border-r border-slate-300 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Class
                  </p>

                  <p className="mt-1 font-bold">{selectedClass?.name ?? "—"}</p>
                </div>

                <div className="border-b border-r border-slate-300 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Session
                  </p>

                  <p className="mt-1 font-bold">
                    {reportCardData.academicSession?.name ?? selectedSessionId}
                  </p>
                </div>

                <div className="border-b border-r border-slate-300 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Term
                  </p>

                  <p className="mt-1 font-bold">
                    {reportCardData.term?.name ?? selectedTerm?.name ?? "—"}
                  </p>
                </div>

                <div className="border-b border-slate-300 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Gender
                  </p>

                  <p className="mt-1 font-bold">{student.gender}</p>
                </div>
              </div>
            </section>

            {/* ================================
                ACADEMIC PERFORMANCE
            ================================= */}

            <section className="report-section px-7">
              <div className="mb-3 flex items-center justify-between">
                <h3
                  className="text-sm font-black uppercase tracking-wide"
                  style={{ color: primaryColor }}
                >
                  Academic Performance
                </h3>

                <span className="text-[10px] font-semibold uppercase text-slate-500">
                  Terminal Assessment
                </span>
              </div>

              <div className="overflow-hidden border border-slate-400">
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr
                      className="text-white"
                      style={{
                        backgroundColor: primaryColor,
                      }}
                    >
                      <th className="border border-slate-400 px-2 py-2 text-left">
                        Subject
                      </th>

                      {reportComponents.map((component) => (
                        <th
                          key={component.componentId}
                          className="border border-slate-400 px-2 py-2 text-center"
                        >
                          {component.componentName} ({component.maxScore})
                        </th>
                      ))}

                      <th className="w-16 border border-slate-400 px-2 py-2 text-center">
                        Total
                      </th>

                      <th className="w-14 border border-slate-400 px-2 py-2 text-center">
                        Grade
                      </th>

                      <th className="border border-slate-400 px-2 py-2 text-left">
                        Remark
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {academicSubjects.map((subject) => (
                      <tr
                        key={subject.subjectId}
                        className="break-inside-avoid"
                      >
                        <td className="border border-slate-300 px-2 py-2 font-semibold">
                          {subject.subjectName}
                        </td>

                        {reportComponents.map((component) => {
                          const score = subject.components.find(
                            (item) =>
                              item.componentId === component.componentId,
                          );

                          return (
                            <td
                              key={component.componentId}
                              className="border border-slate-300 px-2 py-2 text-center"
                            >
                              {score ? score.score : "—"}
                            </td>
                          );
                        })}

                        <td className="border border-slate-300 px-2 py-2 text-center font-bold">
                          {subject.totalScore}
                        </td>

                        <td
                          className="border border-slate-300 px-2 py-2 text-center font-black"
                          style={{ color: primaryColor }}
                        >
                          {subject.grade}
                        </td>

                        <td className="border border-slate-300 px-2 py-2">
                          {subject.remark || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ================================
                PERFORMANCE SUMMARY
            ================================= */}

            <section className="report-section px-7 pt-5">
              <h3
                className="mb-3 text-sm font-black uppercase tracking-wide"
                style={{ color: primaryColor }}
              >
                Performance Summary
              </h3>

              <div className="grid grid-cols-2 border border-slate-300 sm:grid-cols-3 lg:grid-cols-6">
                <div className="border-b border-r border-slate-300 p-3 text-center">
                  <p className="text-[9px] font-bold uppercase text-slate-500">
                    Total Score
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {academic.totalScore}
                  </p>
                </div>

                <div className="border-b border-r border-slate-300 p-3 text-center">
                  <p className="text-[9px] font-bold uppercase text-slate-500">
                    Average
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {academic.averageScore.toFixed(2)}
                  </p>
                </div>

                <div className="border-b border-r border-slate-300 p-3 text-center">
                  <p className="text-[9px] font-bold uppercase text-slate-500">
                    Grade
                  </p>

                  <p
                    className="mt-1 text-lg font-black"
                    style={{ color: primaryColor }}
                  >
                    {academic.grade ?? "—"}
                  </p>
                </div>

                {reportCardData.reportConfiguration.showClassPosition && (
                  <div className="border-b border-r border-slate-300 p-3 text-center">
                    <p className="text-[9px] font-bold uppercase text-slate-500">
                      Position
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {academic.position ?? "—"}
                    </p>
                  </div>
                )}

                <div className="border-b border-r border-slate-300 p-3 text-center">
                  <p className="text-[9px] font-bold uppercase text-slate-500">
                    Class Average
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {academic.classAverage?.toFixed(2) ?? "—"}
                  </p>
                </div>

                <div className="border-b border-slate-300 p-3 text-center">
                  <p className="text-[9px] font-bold uppercase text-slate-500">
                    No. in Class
                  </p>

                  <p className="mt-1 text-lg font-black">{classSize}</p>
                </div>
              </div>
            </section>

            {/* ================================
                ATTENDANCE
            ================================= */}
            {reportCardData.reportConfiguration.showAttendance && (
              <section className="report-section px-7 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3
                    className="text-sm font-black uppercase tracking-wide"
                    style={{ color: primaryColor }}
                  >
                    Attendance
                  </h3>

                  <span className="text-[10px] font-semibold uppercase text-slate-500">
                    {reportCardData.term?.name ?? "Selected Term"}
                  </span>
                </div>

                <div className="grid grid-cols-2 border border-slate-300 sm:grid-cols-5">
                  <div className="border-b border-r border-slate-300 p-3 text-center">
                    <p className="text-[9px] font-bold uppercase text-slate-500">
                      Total Days
                    </p>
                    <p className="mt-1 text-lg font-black">
                      {reportCardData.attendance.total}
                    </p>
                  </div>

                  <div className="border-b border-r border-slate-300 p-3 text-center">
                    <p className="text-[9px] font-bold uppercase text-slate-500">
                      Present
                    </p>
                    <p
                      className="mt-1 text-lg font-black"
                      style={{ color: primaryColor }}
                    >
                      {reportCardData.attendance.present}
                    </p>
                  </div>

                  <div className="border-b border-r border-slate-300 p-3 text-center">
                    <p className="text-[9px] font-bold uppercase text-slate-500">
                      Absent
                    </p>
                    <p className="mt-1 text-lg font-black">
                      {reportCardData.attendance.absent}
                    </p>
                  </div>

                  <div className="border-b border-r border-slate-300 p-3 text-center">
                    <p className="text-[9px] font-bold uppercase text-slate-500">
                      Late
                    </p>
                    <p className="mt-1 text-lg font-black">
                      {reportCardData.attendance.late}
                    </p>
                  </div>

                  <div className="border-b border-slate-300 p-3 text-center">
                    <p className="text-[9px] font-bold uppercase text-slate-500">
                      Excused
                    </p>
                    <p className="mt-1 text-lg font-black">
                      {reportCardData.attendance.excused}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* ================================
                PSYCHOMOTOR / BEHAVIOURAL
            ================================= */}

          

            <section className="report-section px-7 pt-5">
              <h3
                className="mb-3 text-sm font-black uppercase tracking-wide"
                style={{ color: primaryColor }}
              >
                Psychomotor / Behavioural Assessment
              </h3>

              <div className="overflow-hidden border border-slate-400">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr
                      className="text-white"
                      style={{
                        backgroundColor: secondaryColor,
                      }}
                    >
                      <th className="border border-slate-400 px-2 py-2 text-left">
                        Behaviour / Skill
                      </th>

                      <th className="w-28 border border-slate-400 px-2 py-2 text-center">
                        Rating
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {reportCardData.psychomotor.length > 0 ? (
                      reportCardData.psychomotor.map((item) => (
                        <tr key={item.fieldId} className="break-inside-avoid">
                          <td className="border border-slate-300 px-2 py-2 font-semibold">
                            {item.fieldName}
                          </td>

                          <td className="border border-slate-300 px-2 py-2 text-center font-semibold">
                            {item.ratingLabel
                              ? `${item.ratingLabel}${
                                  item.ratingValue
                                    ? ` (${item.ratingValue})`
                                    : ""
                                }`
                              : "Not rated"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
                          className="border border-slate-300 px-3 py-3 text-center text-slate-500"
                        >
                          No psychomotor assessment recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ================================
                COMMENTS
            ================================= */}

            <section className="report-section px-7 pt-5">
              <h3
                className="mb-3 text-sm font-black uppercase tracking-wide"
                style={{ color: primaryColor }}
              >
                Teachers' Comments
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="min-h-[105px] border border-slate-300 p-4">
                  <p
                    className="mb-2 text-[10px] font-black uppercase"
                    style={{ color: primaryColor }}
                  >
                    Class Teacher's Comment
                  </p>

                  <p className="text-xs leading-5 text-slate-700">
                    {reportCardData.comments.teacherComment ||
                      "No teacher comment has been entered."}
                  </p>
                </div>

                <div className="min-h-[105px] border border-slate-300 p-4">
                  <p
                    className="mb-2 text-[10px] font-black uppercase"
                    style={{ color: primaryColor }}
                  >
                    Principal / Head Teacher's Comment
                  </p>

                  <p className="text-xs leading-5 text-slate-700">
                    {reportCardData.comments.principalComment ||
                      "No principal comment has been entered."}
                  </p>
                </div>
              </div>
            </section>

            {/* ================================
                RATING KEYS
            ================================= */}

            <section className="report-section px-7 pt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Academic grading key */}
                <div className="border border-slate-300 p-4">
                  <h3
                    className="mb-3 text-[10px] font-black uppercase"
                    style={{ color: primaryColor }}
                  >
                    Academic Grading Scale
                  </h3>

                  <div className="overflow-hidden border border-slate-300">
                    <table className="w-full border-collapse text-[9px]">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 px-2 py-1.5 text-left">
                            Grade
                          </th>

                          <th className="border border-slate-300 px-2 py-1.5 text-center">
                            Score
                          </th>

                          <th className="border border-slate-300 px-2 py-1.5 text-left">
                            Remark
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {activeGradeScales.length > 0 ? (
                          activeGradeScales.map((scale) => (
                            <tr key={scale.id}>
                              <td className="border border-slate-300 px-2 py-1.5 font-bold">
                                {scale.code}
                              </td>

                              <td className="border border-slate-300 px-2 py-1.5 text-center">
                                {scale.minScore}–{scale.maxScore}
                              </td>

                              <td className="border border-slate-300 px-2 py-1.5">
                                {scale.remark || "—"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={3}
                              className="border border-slate-300 px-2 py-2 text-center text-slate-500"
                            >
                              Grading scale not configured.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Psychomotor rating key */}
                <div className="border border-slate-300 p-4">
                  <h3
                    className="mb-3 text-[10px] font-black uppercase"
                    style={{ color: primaryColor }}
                  >
                    Psychomotor Rating Scale
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    {[
                      ["5", "Excellent"],
                      ["4", "Very Good"],
                      ["3", "Good"],
                      ["2", "Fair"],
                      ["1", "Needs Improvement"],
                    ].map(([value, label]) => (
                      <div
                        key={value}
                        className="flex items-center gap-2 border border-slate-200 px-2 py-2"
                      >
                        <span className="font-black">{value}</span>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ================================
                APPROVAL / SIGNATURES
            ================================= */}

            <section className="signature-section px-7 pb-7 pt-6">
              <div className="border-t-2 pt-5">
                <div className="grid gap-8 sm:grid-cols-3">
                  {/* Class Teacher */}
                  {reportCardData.reportConfiguration.showClassTeacherName && (
                    <div className="text-center">
                      <div className="flex h-12 items-end justify-center border-b border-slate-500">
                        <span className="pb-1 text-xs font-semibold">
                          {classTeacher
                            ? `${classTeacher.firstName} ${classTeacher.lastName}`
                            : "No class teacher assigned"}
                        </span>
                      </div>

                      <p className="mt-2 text-[10px] font-bold uppercase">
                        Class Teacher
                      </p>
                    </div>
                  )}

                  {/* Principal Signature */}
                  {reportCardData.reportConfiguration
                    .showPrincipalSignature && (
                    <div className="text-center">
                      <div className="flex h-12 items-end justify-center border-b border-slate-500">
                        {school.principalSignatureUrl ? (
                          <img
                            src={school.principalSignatureUrl}
                            alt="Principal signature"
                            className="max-h-12 max-w-32 object-contain"
                          />
                        ) : (
                          <span className="pb-1 text-[9px] uppercase text-slate-400">
                            Signature
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-[10px] font-bold uppercase">
                        {school.principalTitle || "Principal / Head Teacher"}
                      </p>

                      {school.principalName && (
                        <p className="mt-1 text-[9px] font-medium">
                          {school.principalName}
                        </p>
                      )}
                    </div>
                  )}

                  {/* School Stamp */}
                  {reportCardData.reportConfiguration.showSchoolStamp && (
                    <div className="text-center">
                      <div className="flex h-12 items-center justify-center border-b border-slate-500">
                        {school.stampUrl ? (
                          <img
                            src={school.stampUrl}
                            alt="Official school stamp"
                            className="h-16 w-16 object-contain"
                          />
                        ) : (
                          <span className="text-[9px] uppercase text-slate-400">
                            Official School Stamp
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-[10px] font-bold uppercase">
                        School Stamp
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ================================
                FOOTER
            ================================= */}

            <footer
              className="px-7 py-3 text-center text-[9px] text-white"
              style={{
                backgroundColor: primaryColor,
              }}
            >
              <p className="font-semibold uppercase tracking-wider">
                {school.name}
              </p>

              <p className="mt-0.5 opacity-90">
                Terminal Report Sheet ·{" "}
                {reportCardData.academicSession?.name ?? "Academic Session"} ·{" "}
                {reportCardData.term?.name ?? "Term"}
              </p>
            </footer>
          </main>
        ) : (
          <div className="print-hidden mx-auto max-w-5xl rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-semibold text-slate-800">
              Report card data is not available yet.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Make sure all required academic results have been calculated for
              this student and term.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
