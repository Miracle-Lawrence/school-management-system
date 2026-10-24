import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import { sendOutstandingFeeReminders } from "@/lib/services/fee-reminder.service";

export async function POST() {
  try {
    const session = await requireApiRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    if (session instanceof NextResponse) {
      return session;
    }

    const schoolId = session.user.schoolId;
    const createdByUserId = Number(session.user.id);

    if (
      !schoolId ||
      !Number.isSafeInteger(createdByUserId) ||
      createdByUserId <= 0
    ) {
      return NextResponse.json(
        { error: "Valid school and user context are required." },
        { status: 400 },
      );
    }

    const result = await sendOutstandingFeeReminders(schoolId, createdByUserId);

    if (result.remindersCreated === 0) {
      return NextResponse.json({
        message: "No new fee reminders were sent.",
        ...result,
      });
    }

    return NextResponse.json({
      message: "Outstanding fee reminders sent successfully.",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "School not found.") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message === "You are not authorized to send fee reminders.") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    console.error("Failed to send fee reminders:", error);

    return NextResponse.json(
      { error: "Unable to send fee reminders." },
      { status: 500 },
    );
  }
}
