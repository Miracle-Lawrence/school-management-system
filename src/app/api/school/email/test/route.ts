import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import { sendEmail } from "@/lib/services/email.service";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await requireApiRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    if (session instanceof NextResponse) {
      return session;
    }

    const email = session.user.email?.trim();

    if (!email) {
      return NextResponse.json(
        { error: "Your account does not have an email address." },
        { status: 400 },
      );
    }

    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      return NextResponse.json(
        { error: "Email delivery is not configured." },
        { status: 503 },
      );
    }

    const result = await sendEmail({
      to: email,
      subject: "School Management System — Test Email",
      text: [
        "Hello,",
        "",
        "This is a test email from your School Management System.",
        "Your email service is configured and accepted this message for delivery.",
        "",
        "No action is required.",
      ].join("\n"),
    });

    return NextResponse.json({
      message: "The test email was accepted by the email provider.",
      emailId: result.id,
    });
  } catch (error) {
    console.error("Test email request failed.", error);

    return NextResponse.json(
      {
        error: "Unable to send the test email. Check your email configuration.",
      },
      { status: 500 },
    );
  }
}
