
import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    return new Response("School context is required.", { status: 403 });
  }

  const { id } = await params;
  const studentId = Number(id);

  if (!Number.isSafeInteger(studentId) || studentId <= 0) {
    return new Response("Invalid student.", { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date") || "";
  const sessionIdParam = searchParams.get("sessionId");
  const termIdParam = searchParams.get("termId");

  const selectedSessionId =
    sessionIdParam !== null && sessionIdParam.trim() !== ""
      ? Number(sessionIdParam)
      : null;

  const selectedTermId =
    termIdParam !== null && termIdParam.trim() !== ""
      ? Number(termIdParam)
      : null;

  if (
    (selectedSessionId !== null &&
      (!Number.isSafeInteger(selectedSessionId) ||
        selectedSessionId <= 0)) ||
    (selectedTermId !== null &&
      (!Number.isSafeInteger(selectedTermId) || selectedTermId <= 0))
  ) {
    return new Response("Invalid session or term filter.", { status: 400 });
  }

  if (selectedTermId !== null && selectedSessionId === null) {
    return new Response("A term filter requires an academic session.", {
      status: 400,
    });
  }

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response("Invalid date filter.", { status: 400 });
  }

  const school = await db.orm.public.School.where((school) =>
    school.id.eq(schoolId),
  ).first();

  if (!school) {
    return new Response("School not found.", { status: 404 });
  }

  const student = await db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    return new Response("Student not found.", { status: 404 });
  }

  let studentClassName = "Not assigned";

  if (student.classId) {
    const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
      schoolClass.id.eq(student.classId!),
    ).first();

    if (schoolClass && schoolClass.schoolId === schoolId) {
      studentClassName = schoolClass.name;
    }
  }

  const academicSessions = await db.orm.public.AcademicSession.where(
    (academicSession) => academicSession.schoolId.eq(schoolId),
  ).all();

  const selectedSession =
    selectedSessionId !== null
      ? academicSessions.find(
          (academicSession) => academicSession.id === selectedSessionId,
        )
      : undefined;

  if (selectedSessionId !== null && !selectedSession) {
    return new Response("Academic session not found.", { status: 404 });
  }

  let terms: Awaited<ReturnType<typeof db.orm.public.Term.all>> = [];

  if (selectedSessionId !== null) {
    terms = await db.orm.public.Term.where((term) =>
      term.sessionId.eq(selectedSessionId),
    ).all();
  }

  if (
    selectedTermId !== null &&
    !terms.some((term) => term.id === selectedTermId)
  ) {
    return new Response("Term not found for the selected session.", {
      status: 404,
    });
  }

  const selectedTerm =
    selectedTermId !== null
      ? terms.find((term) => term.id === selectedTermId)
      : undefined;

  const attendanceRecords = await db.orm.public.Attendance.where((attendance) =>
    attendance.studentId.eq(studentId),
  ).all();

  const validTermIds = new Set(terms.map((term) => term.id));

  const records = attendanceRecords
    .filter((record) => {
      if (selectedTermId !== null && record.termId !== selectedTermId) {
        return false;
      }

      if (selectedSessionId !== null && !validTermIds.has(record.termId)) {
        return false;
      }

      if (date && record.date.toString().slice(0, 10) !== date) {
        return false;
      }

      return true;
    })
    .map((record) => ({
      date: record.date.toString().slice(0, 10),
      status: record.status,
      notes: record.notes || "",
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const fullName = `${student.firstName} ${
    student.middleName ? `${student.middleName} ` : ""
  }${student.lastName}`;

  const total = records.length;
  const present = records.filter((record) => record.status === "PRESENT").length;
  const absent = records.filter((record) => record.status === "ABSENT").length;
  const late = records.filter((record) => record.status === "LATE").length;
  const excused = records.filter((record) => record.status === "EXCUSED").length;

  const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;

  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    bufferPages: true,
  });

  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });

  const pdfReady = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const left = 40;
  const right = 555;
  const pageBottom = 770;

  function drawTableHeader() {
    doc.font("Helvetica-Bold").fontSize(8);
    doc.text("Date", 40, doc.y, { width: 100 });
    doc.text("Status", 140, doc.y, { width: 100 });
    doc.text("Notes", 240, doc.y, { width: 315 });

    doc.moveDown(0.6);
    doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke();
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(8);
  }

  // Report header
  doc.font("Helvetica-Bold").fontSize(18).text(school.name, {
    align: "center",
  });

  doc.moveDown(0.3);

  doc.fontSize(15).text("STUDENT ATTENDANCE REPORT", {
    align: "center",
  });

  doc.moveDown(1);

  // Student information
  doc.font("Helvetica-Bold").fontSize(11).text("Student Information");
  doc.moveDown(0.5);

  doc.font("Helvetica").fontSize(10);

  const studentInfoY = doc.y;

  doc.text(`Student: ${fullName}`, 40, studentInfoY, { width: 255 });
  doc.text(`Admission No.: ${student.admissionNumber}`, 300, studentInfoY, {
    width: 255,
  });

  doc.text(`Class: ${studentClassName}`, 40, studentInfoY + 18, {
    width: 255,
  });

  doc.text(
    `Academic Session: ${selectedSession?.name || "All Sessions"}`,
    300,
    studentInfoY + 18,
    { width: 255 },
  );

  doc.text(`Term: ${selectedTerm?.name || "All Terms"}`, 40, studentInfoY + 36, {
    width: 255,
  });

  doc.text(`Date: ${date || "All Dates"}`, 300, studentInfoY + 36, {
    width: 255,
  });

  doc.y = studentInfoY + 60;

  // Attendance summary
  doc.font("Helvetica-Bold").fontSize(11).text("Attendance Summary");
  doc.moveDown(0.5);

  const summaryY = doc.y;
  const summaryWidth = 115;
  const summaryHeight = 45;

  const summaryItems = [
    { label: "Total Records", value: String(total) },
    { label: "Present", value: String(present) },
    { label: "Absent", value: String(absent) },
    { label: "Late", value: String(late) },
  ];

  summaryItems.forEach((item, index) => {
    const x = 40 + index * summaryWidth;

    doc.roundedRect(x, summaryY, summaryWidth - 8, summaryHeight, 4).stroke();

    doc.font("Helvetica").fontSize(8).text(item.label, x + 8, summaryY + 8, {
      width: summaryWidth - 24,
      align: "center",
    });

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(item.value, x + 8, summaryY + 21, {
        width: summaryWidth - 24,
        align: "center",
      });
  });

  doc.y = summaryY + summaryHeight + 12;

  doc.font("Helvetica").fontSize(9).text(
    `Excused: ${excused}    |    Attendance Rate: ${attendanceRate.toFixed(1)}%`,
    { align: "center" },
  );

  doc.moveDown(1);

  doc.font("Helvetica-Bold").fontSize(11).text("Attendance History");
  doc.moveDown(0.6);

  drawTableHeader();

  for (const record of records) {
    const rowTop = doc.y;

    const dateHeight = doc.heightOfString(record.date, { width: 100 });
    const statusHeight = doc.heightOfString(record.status, { width: 100 });
    const notesHeight = doc.heightOfString(record.notes || "—", {
      width: 315,
    });

    const rowHeight = Math.max(dateHeight, statusHeight, notesHeight) + 8;

    if (rowTop + rowHeight > pageBottom) {
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(12).text(
        `${school.name} — Student Attendance`,
        { align: "center" },
      );
      doc.moveDown(1);
      drawTableHeader();
    }

    const y = doc.y;

    doc.font("Helvetica").fontSize(8);
    doc.text(record.date, 40, y, { width: 100 });
    doc.text(record.status, 140, y, { width: 100 });
    doc.text(record.notes || "—", 240, y, { width: 315 });

    doc.y = y + rowHeight;
    doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke();
    doc.moveDown(0.4);
  }

  if (records.length === 0) {
    doc.font("Helvetica").fontSize(10).text(
      "No attendance records found for the selected filters.",
      { align: "center" },
    );
  }

  // Add a footer to every page.
  const pageRange = doc.bufferedPageRange();

  for (
    let pageIndex = pageRange.start;
    pageIndex < pageRange.start + pageRange.count;
    pageIndex++
  ) {
    doc.switchToPage(pageIndex);
    doc.font("Helvetica").fontSize(8).fillColor("gray");
    doc.text("Generated by the School Management System", 40, 805, {
      width: 515,
      align: "center",
      lineBreak: false,
    });
    doc.fillColor("black");
  }

  doc.end();

  const pdf = await pdfReady;
  const safeStudentName = fullName.replace(/[^a-z0-9]+/gi, "-");

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="student-attendance-${safeStudentName}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
