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
    return new Response("School context is required.", {
      status: 403,
    });
  }

  const { id } = await params;
  const studentId = Number(id);

  if (!Number.isInteger(studentId)) {
    return new Response("Invalid student.", {
      status: 400,
    });
  }

  const searchParams = request.nextUrl.searchParams;

  const date = searchParams.get("date") || "";
  const sessionIdParam = searchParams.get("sessionId");
  const termIdParam = searchParams.get("termId");

  const selectedSessionId =
    sessionIdParam && Number.isInteger(Number(sessionIdParam))
      ? Number(sessionIdParam)
      : null;

  const selectedTermId =
    termIdParam && Number.isInteger(Number(termIdParam))
      ? Number(termIdParam)
      : null;

  const school = await db.orm.public.School.where((school) =>
    school.id.eq(schoolId),
  ).first();

  if (!school) {
    return new Response("School not found.", {
      status: 404,
    });
  }

  const student = await db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    return new Response("Student not found.", {
      status: 404,
    });
  }

  let studentClassName = "Not assigned";

  if (student.classId) {
    const schoolClass = await db.orm.public.SchoolClass.where((schoolClass) =>
      schoolClass.id.eq(student.classId!),
    ).first();

    if (schoolClass) {
      studentClassName = schoolClass.name;
    }
  }

  const academicSessions = await db.orm.public.AcademicSession.where(
    (academicSession) => academicSession.schoolId.eq(schoolId),
  ).all();

  let terms: Awaited<ReturnType<typeof db.orm.public.Term.all>> = [];

  if (selectedSessionId) {
    const selectedSession = academicSessions.find(
      (academicSession) => academicSession.id === selectedSessionId,
    );

    if (selectedSession) {
      terms = await db.orm.public.Term.where((term) =>
        term.sessionId.eq(selectedSessionId),
      ).all();
    }
  }

  const attendanceRecords = await db.orm.public.Attendance.where((attendance) =>
    attendance.studentId.eq(studentId),
  ).all();

  const records = attendanceRecords
    .filter((record) => {
      if (selectedTermId && record.termId !== selectedTermId) {
        return false;
      }

      if (date) {
        const recordDate = record.date.toString().slice(0, 10);

        if (recordDate !== date) {
          return false;
        }
      }

      if (selectedSessionId) {
        const matchingTerm = terms.find((term) => term.id === record.termId);

        if (!matchingTerm) {
          return false;
        }
      }

      return true;
    })
    .map((record) => ({
      date: record.date.toString().slice(0, 10),
      status: record.status,
      notes: record.notes || "",
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const selectedSession = selectedSessionId
    ? academicSessions.find(
        (academicSession) => academicSession.id === selectedSessionId,
      )
    : undefined;

  const selectedTerm = selectedTermId
    ? terms.find((term) => term.id === selectedTermId)
    : undefined;

  const total = records.length;

  const present = records.filter(
    (record) => record.status === "PRESENT",
  ).length;

  const absent = records.filter((record) => record.status === "ABSENT").length;

  const late = records.filter((record) => record.status === "LATE").length;

  const excused = records.filter(
    (record) => record.status === "EXCUSED",
  ).length;

  const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;

  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
  });

  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => {
    chunks.push(chunk);
  });

  const pdfReady = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on("error", reject);
  });

  /*
   * REPORT HEADER
   */

  doc.font("Helvetica-Bold").fontSize(18).text(school.name, {
    align: "center",
  });

  doc.moveDown(0.3);

  doc.fontSize(15).text("STUDENT ATTENDANCE REPORT", {
    align: "center",
  });

  doc.moveDown(1);

  /*
   * STUDENT INFORMATION
   */

  doc.font("Helvetica-Bold").fontSize(11).text("Student Information");

  doc.moveDown(0.5);

  doc.font("Helvetica").fontSize(10);

  const fullName = `${student.firstName} ${
    student.middleName ? `${student.middleName} ` : ""
  }${student.lastName}`;

  const studentInfoY = doc.y;

  doc.text(`Student: ${fullName}`, 40, studentInfoY);

  doc.text(`Admission No.: ${student.admissionNumber}`, 300, studentInfoY);

  doc.text(`Class: ${studentClassName}`, 40, studentInfoY + 18);

  doc.text(
    `Academic Session: ${selectedSession?.name || "All Sessions"}`,
    300,
    studentInfoY + 18,
  );

  doc.text(`Term: ${selectedTerm?.name || "All Terms"}`, 40, studentInfoY + 36);

  doc.text(`Date: ${date || "All Dates"}`, 300, studentInfoY + 36);

  doc.moveDown(4);

  /*
   * SUMMARY
   */

  doc.font("Helvetica-Bold").fontSize(11).text("Attendance Summary");

  doc.moveDown(0.5);

  const summaryY = doc.y;
  const summaryWidth = 115;
  const summaryHeight = 45;

  const summaryItems = [
    {
      label: "Total Records",
      value: String(total),
    },
    {
      label: "Present",
      value: String(present),
    },
    {
      label: "Absent",
      value: String(absent),
    },
    {
      label: "Late",
      value: String(late),
    },
  ];

  summaryItems.forEach((item, index) => {
    const x = 40 + index * summaryWidth;

    doc.roundedRect(x, summaryY, summaryWidth - 8, summaryHeight, 4).stroke();

    doc
      .font("Helvetica")
      .fontSize(8)
      .text(item.label, x + 8, summaryY + 8, {
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

  doc
    .font("Helvetica")
    .fontSize(9)
    .text(
      `Excused: ${excused}    |    Attendance Rate: ${attendanceRate.toFixed(
        1,
      )}%`,
      {
        align: "center",
      },
    );

  doc.moveDown(1);

  /*
   * ATTENDANCE HISTORY TABLE
   */

  doc.font("Helvetica-Bold").fontSize(11).text("Attendance History");

  doc.moveDown(0.6);

  const tableTop = doc.y;

  doc.font("Helvetica-Bold").fontSize(8);

  doc.text("Date", 40, tableTop, {
    width: 100,
  });

  doc.text("Status", 140, tableTop, {
    width: 100,
  });

  doc.text("Notes", 240, tableTop, {
    width: 315,
  });

  doc.moveDown(0.6);

  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();

  doc.moveDown(0.5);

  doc.font("Helvetica").fontSize(8);

  for (const record of records) {
    if (doc.y > 755) {
      doc.addPage();

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(`${school.name} — Student Attendance`, {
          align: "center",
        });

      doc.moveDown(1);

      doc.font("Helvetica-Bold").fontSize(8);

      doc.text("Date", 40, doc.y, {
        width: 100,
      });

      doc.text("Status", 140, doc.y, {
        width: 100,
      });

      doc.text("Notes", 240, doc.y, {
        width: 315,
      });

      doc.moveDown(0.6);

      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();

      doc.moveDown(0.5);

      doc.font("Helvetica").fontSize(8);
    }

    const rowY = doc.y;

    doc.text(record.date, 40, rowY, {
      width: 100,
    });

    doc.text(record.status, 140, rowY, {
      width: 100,
    });

    doc.text(record.notes || "—", 240, rowY, {
      width: 315,
    });

    doc.moveDown(1.7);

    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();

    doc.moveDown(0.4);
  }

  if (records.length === 0) {
    doc
      .font("Helvetica")
      .fontSize(10)
      .text("No attendance records found for the selected filters.", {
        align: "center",
      });
  }

  /*
   * FOOTER
   */

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("gray")
    .text("Generated by the School Management System", 40, 805, {
      width: 515,
      align: "center",
    });

  doc.end();

  const pdf = await pdfReady;

  const safeStudentName = fullName.replace(/[^a-z0-9]+/gi, "-");

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="student-attendance-${safeStudentName}.pdf"`,
    },
  });
}
