import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export async function GET() {
  try {
    const session = await requireApiRole([
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
    ]);

    if (session instanceof NextResponse) {
      return session;
    }

    const enquiries = await db.orm.public.ContactEnquiry
      .orderBy((enquiry) => enquiry.createdAt.desc())
      .all();

    const unreadCount = enquiries.filter(
      (enquiry) => enquiry.status === "NEW",
    ).length;

    return NextResponse.json({
      enquiries,
      unreadCount,
    });
  } catch (error) {
    console.error("Failed to retrieve contact enquiries:", error);

    return NextResponse.json(
      { error: "Unable to retrieve enquiries." },
      { status: 500 },
    );
  }
}

