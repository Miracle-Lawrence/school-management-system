import { NextResponse } from "next/server";

import { processDueEmailRetries } from "@/lib/services/email-delivery.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  return Boolean(
    secret &&
      request.headers.get("authorization") === `Bearer ${secret}`,
  );
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Email retry processing is not configured." },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json(
      { error: "Email delivery is not configured." },
      { status: 503 },
    );
  }

  try {
    const summary = await processDueEmailRetries();

    return NextResponse.json({
      success: true,
      ...summary,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Email retry worker failed.", error);

    return NextResponse.json(
      { error: "Unable to process email retries." },
      { status: 500 },
    );
  }
}
