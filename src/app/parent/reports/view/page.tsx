import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { db } from "@/prisma/db";
import { requireRole } from "@/lib/auth/authorization";
import { getStudentReportCardData } from "@/lib/services/report-card.service";
import PrintButton from "@/app/school/results/report-card/print-button";

type SearchParams = {
  studentId?: string | string[];
  classId?: string | string[];
  termId?: string | string[];
  reportType?: string | string[];
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

function parsePositiveInteger(
  value: string | string[] | undefined,
): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export default async function ParentReportViewPage({
  searchParams,
}: PageProps) {
  const session = await requireRole(["PARENT"]);

  const userId = Number(session.user.id);
  const schoolId = Number(session.user.schoolId);

  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    !Number.isSafeInteger(schoolId) ||
    schoolId <= 0
  ) {
    notFound();
  }

  const user = await db.orm.public.User.where((item) =>
    item.id.eq(userId),
  ).first();

  if (!user || !user.isActive) {
    redirect("/login");
  }

  if (user.mustChangePassword) {
    redirect("/parent/change-password");
  }

  const parent = await db.orm.public.Parent.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!parent || parent.schoolId !== schoolId) {
    notFound();
  }

  const params = await searchParams;

  const studentId = parsePositiveInteger(params.studentId);
  const classId = parsePositiveInteger(params.classId);
  const termId = parsePositiveInteger(params.termId);

  const rawReportType =
    typeof params.reportType === "string" ? params.reportType : "";

  if (
    !studentId ||
    !classId ||
    !termId ||
    (rawReportType !== "MID_TERM" && rawReportType !== "TERMINAL")
  ) {
    notFound();
  }

  const reportType = rawReportType as "MID_TERM" | "TERMINAL";

  // Verify that this child is linked to the logged-in parent.
  const parentLinks = await db.orm.public.ParentStudent.where((item) =>
    item.parentId.eq(parent.id),
  ).all();

  if (!parentLinks.some((link) => link.studentId === studentId)) {
    notFound();
  }

  // Verify that the child belongs to this school.
  const student = await db.orm.public.Student.where((item) =>
    item.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    notFound();
  }

  // Verify that the exact class, term and report type are published.
  const schoolPublications = await db.orm.public.ReportPublication.where(
    (item) => item.schoolId.eq(schoolId),
  ).all();

  const publication = schoolPublications.find(
    (item) =>
      item.classId === classId &&
      item.termId === termId &&
      item.reportType === reportType &&
      item.isPublished,
  );

  if (!publication) {
    notFound();
  }

  // A publication alone is insufficient: this child must have a
  // matching result for the selected report.
  const studentResults = await db.orm.public.StudentTermResult.where((item) =>
    item.studentId.eq(studentId),
  ).all();

  const matchingResult = studentResults.some(
    (result) =>
      result.schoolId === schoolId &&
      result.studentId === studentId &&
      result.classId === classId &&
      result.termId === termId &&
      result.reportType === reportType,
  );

  if (!matchingResult) {
    notFound();
  }

  // Reuse the existing report calculation and configuration service.
  let reportData;

  try {
    reportData = await getStudentReportCardData(
      schoolId,
      studentId,
      classId,
      termId,
      reportType,
    );
  } catch {
    // Do not expose reports when the report configuration or
    // required report data cannot be loaded.
    notFound();
  }

  const {
    school,
    student: reportStudent,
    schoolClass,
    academicSession,
    term,
    reportConfiguration,
    academic,
    attendance,
    psychomotor,
    comments,
    classTeacher,
  } = reportData;

  // Build the component columns from the actual returned subject data.
  const componentColumns = [
    ...new Map(
      academic.subjects
        .flatMap((subject) => subject.components)
        .map((component) => [component.componentId, component] as const),
    ).values(),
  ].sort((a, b) => a.displayOrder - b.displayOrder);

  const primaryColor = "#1e3a8a";
  const secondaryColor = "#334155";
  const studentName = [
    reportStudent.firstName,
    reportStudent.middleName,
    reportStudent.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6">
      <style>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        @media print {
          body {
            background: #fff !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print-hidden {
            display: none !important;
          }

          .report-sheet {
            width: 100% !important;
            min-height: 0 !important;
            margin: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
          }

          .report-section,
          .signature-section,
          tr {
            break-inside: avoid;
          }

          .report-sheet img {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="print-hidden mx-auto mb-5 flex max-w-5xl items-center justify-between gap-3">
        <Link
          href="/parent/reports"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          &larr; Back to Reports
        </Link>

        <PrintButton />
      </div>

      <main
        className="report-sheet mx-auto max-w-5xl overflow-hidden border border-slate-300 bg-white text-slate-900 shadow-xl"
        style={{ borderTopWidth: "6px", borderTopColor: primaryColor }}
      >
        {/* School identity */}
        <section
          className="report-section border-b-2 px-5 py-6 sm:px-7"
          style={{ borderBottomColor: primaryColor }}
        >
          <div className="grid grid-cols-[64px_1fr] items-center gap-4 sm:grid-cols-[90px_1fr_90px]">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 bg-white p-1 sm:h-20 sm:w-20">
              {school.logoUrl ? (
                <img
                  src={school.logoUrl}
                  alt={`${school.name} logo`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span
                  className="text-xs font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  LOGO
                </span>
              )}
            </div>

            <div className="text-center">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: secondaryColor }}
              >
                Official School Report
              </p>

              <h1
                className="mt-1 text-xl font-black uppercase sm:text-3xl"
                style={{ color: primaryColor }}
              >
                {school.name}
              </h1>

              {school.motto && (
                <p className="mt-1 text-sm italic text-slate-600">
                  {school.motto}
                </p>
              )}

              <div className="mt-2 space-y-1 text-xs text-slate-600">
                {school.address && <p>{school.address}</p>}

                {[school.city, school.state, school.country].filter(Boolean)
                  .length > 0 && (
                  <p>
                    {[school.city, school.state, school.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}

                {school.phone && <p>Tel: {school.phone}</p>}
                {school.website && <p>{school.website}</p>}
              </div>
            </div>

            <div className="hidden h-24 w-20 justify-self-end overflow-hidden border-2 border-slate-400 bg-slate-100 sm:flex">
              {reportStudent.photoUrl ? (
                <img
                  src={reportStudent.photoUrl}
                  alt={studentName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center px-2 text-center text-xs text-slate-500">
                  Passport photo
                </div>
              )}
            </div>
          </div>

          <div
            className="mx-auto mt-5 w-fit border-y-2 px-6 py-2 text-center"
            style={{ borderColor: primaryColor }}
          >
            <h2
              className="text-lg font-black uppercase tracking-wide"
              style={{ color: primaryColor }}
            >
              {reportConfiguration.name}
            </h2>
            <p className="mt-1 text-xs uppercase tracking-wider text-slate-600">
              Academic Performance Report
            </p>
          </div>
        </section>

        {/* Student information */}
        <section className="report-section px-5 py-5 sm:px-7">
          <div className="grid grid-cols-2 border border-slate-300 sm:grid-cols-3">
            {[
              ["Student Name", studentName],
              ["Admission No.", reportStudent.admissionNumber],
              ["Class", schoolClass.name],
              ["Session", academicSession.name],
              ["Term", term.name],
              ["Gender", reportStudent.gender],
            ].map(([label, value]) => (
              <div
                key={label}
                className="border-b border-r border-slate-300 p-3"
              >
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  {label}
                </p>
                <p className="mt-1 break-words text-sm font-bold">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Academic performance */}
        <section className="report-section px-5 sm:px-7">
          <h3
            className="mb-3 text-sm font-black uppercase tracking-wide"
            style={{ color: primaryColor }}
          >
            Academic Performance
          </h3>

          <div className="overflow-x-auto border border-slate-400">
            <table className="w-full border-collapse text-[10px] sm:text-[11px]">
              <thead>
                <tr
                  className="text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <th className="border border-slate-400 px-2 py-2 text-left">
                    Subject
                  </th>

                  {componentColumns.map((component) => (
                    <th
                      key={component.componentId}
                      className="border border-slate-400 px-2 py-2 text-center"
                    >
                      {component.componentName} ({component.maxScore})
                    </th>
                  ))}

                  <th className="border border-slate-400 px-2 py-2 text-center">
                    Total
                  </th>
                  <th className="border border-slate-400 px-2 py-2 text-center">
                    Grade
                  </th>
                  <th className="border border-slate-400 px-2 py-2 text-left">
                    Remark
                  </th>
                </tr>
              </thead>

              <tbody>
                {academic.subjects.length > 0 ? (
                  academic.subjects.map((subject) => (
                    <tr key={subject.subjectId}>
                      <td className="border border-slate-300 px-2 py-2 font-semibold">
                        {subject.subjectName}
                      </td>

                      {componentColumns.map((component) => {
                        const score = subject.components.find(
                          (item) => item.componentId === component.componentId,
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
                        className="border border-slate-300 px-2 py-2 text-center font-bold"
                        style={{ color: primaryColor }}
                      >
                        {subject.grade ?? "—"}
                      </td>
                      <td className="border border-slate-300 px-2 py-2">
                        {subject.remark || "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={componentColumns.length + 4}
                      className="border border-slate-300 px-3 py-4 text-center text-slate-500"
                    >
                      No subject results are available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Performance summary */}
        <section className="report-section px-5 pt-5 sm:px-7">
          <h3
            className="mb-3 text-sm font-black uppercase tracking-wide"
            style={{ color: primaryColor }}
          >
            Performance Summary
          </h3>

          <div className="grid grid-cols-2 border border-slate-300 sm:grid-cols-3">
            {[
              ["Total Score", academic.totalScore],
              [
                "Average",
                academic.averageScore !== null
                  ? academic.averageScore.toFixed(2)
                  : "Pending",
              ],
              ["Grade", academic.grade ?? "—"],
              ...(reportConfiguration.showClassPosition
                ? [["Position", academic.position ?? "—"]]
                : []),
              ["Class Average", academic.classAverage?.toFixed(2) ?? "—"],
              ["Students in Class", academic.classSize],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="border-b border-r border-slate-300 p-3 text-center"
              >
                <p className="text-[9px] font-bold uppercase text-slate-500">
                  {label}
                </p>
                <p className="mt-1 text-lg font-black">{value ?? "—"}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Attendance */}
        {reportConfiguration.showAttendance && (
          <section className="report-section px-5 pt-5 sm:px-7">
            <h3
              className="mb-3 text-sm font-black uppercase tracking-wide"
              style={{ color: primaryColor }}
            >
              Attendance
            </h3>

            <div className="grid grid-cols-2 border border-slate-300 sm:grid-cols-5">
              {[
                ["Total Days", attendance.total],
                ["Present", attendance.present],
                ["Absent", attendance.absent],
                ["Late", attendance.late],
                ["Excused", attendance.excused],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="border-b border-r border-slate-300 p-3 text-center"
                >
                  <p className="text-[9px] font-bold uppercase text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 text-lg font-black">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Psychomotor assessment */}
        <section className="report-section px-5 pt-5 sm:px-7">
          <h3
            className="mb-3 text-sm font-black uppercase tracking-wide"
            style={{ color: primaryColor }}
          >
            Psychomotor / Behavioural Assessment
          </h3>

          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr
                className="text-white"
                style={{ backgroundColor: secondaryColor }}
              >
                <th className="border border-slate-400 px-2 py-2 text-left">
                  Behaviour / Skill
                </th>
                <th className="border border-slate-400 px-2 py-2 text-center">
                  Rating
                </th>
              </tr>
            </thead>

            <tbody>
              {psychomotor.length > 0 ? (
                psychomotor.map((item) => (
                  <tr key={item.fieldId}>
                    <td className="border border-slate-300 px-2 py-2 font-semibold">
                      {item.fieldName}
                    </td>
                    <td className="border border-slate-300 px-2 py-2 text-center">
                      {item.ratingLabel
                        ? `${item.ratingLabel}${
                            item.ratingValue ? ` (${item.ratingValue})` : ""
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
        </section>

        {/* Comments */}
        <section className="report-section px-5 pt-5 sm:px-7">
          <h3
            className="mb-3 text-sm font-black uppercase tracking-wide"
            style={{ color: primaryColor }}
          >
            Teachers&apos; Comments
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Class Teacher's Comment", comments.teacherComment],
              ["Principal / Head Teacher's Comment", comments.principalComment],
            ].map(([label, comment]) => (
              <div
                key={String(label)}
                className="min-h-[100px] border border-slate-300 p-4"
              >
                <p
                  className="mb-2 text-[10px] font-black uppercase"
                  style={{ color: primaryColor }}
                >
                  {label}
                </p>
                <p className="whitespace-pre-wrap text-xs leading-5 text-slate-700">
                  {comment || "No comment has been entered."}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Signatures and school stamp */}
        <section className="signature-section px-5 pb-7 pt-6 sm:px-7">
          <div className="border-t-2 pt-5">
            <div className="grid gap-8 sm:grid-cols-3">
              {reportConfiguration.showClassTeacherName && (
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

              {reportConfiguration.showPrincipalSignature && (
                <div className="text-center">
                  <div className="flex h-12 items-end justify-center border-b border-slate-500">
                    {school.principalSignatureUrl ? (
                      <img
                        src={school.principalSignatureUrl}
                        alt="Principal signature"
                        className="max-h-12 max-w-32 object-contain"
                      />
                    ) : (
                      <span className="pb-1 text-xs text-slate-400">
                        Signature
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[10px] font-bold uppercase">
                    {school.principalTitle || "Principal / Head Teacher"}
                  </p>
                  {school.principalName && (
                    <p className="mt-1 text-[9px]">{school.principalName}</p>
                  )}
                </div>
              )}

              {reportConfiguration.showSchoolStamp && (
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

        <footer
          className="px-5 py-3 text-center text-[9px] text-white sm:px-7"
          style={{ backgroundColor: primaryColor }}
        >
          <p className="font-semibold uppercase tracking-wider">
            {school.name}
          </p>
          <p className="mt-1">
            {reportConfiguration.name} · {academicSession.name} · {term.name}
          </p>
        </footer>
      </main>
    </div>
  );
}
