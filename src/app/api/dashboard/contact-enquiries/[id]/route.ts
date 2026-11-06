import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

const updateSchema = z.object({
  status: z.enum(["READ", "REPLIED", "ARCHIVED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireApiRole([
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
    ]);

    if (session instanceof NextResponse) {
      return session;
    }

    const { id } = await params;
    const enquiryId = Number(id);

    if (!Number.isSafeInteger(enquiryId) || enquiryId < 1) {
      return NextResponse.json(
        { error: "Invalid enquiry ID." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid enquiry status." },
        { status: 400 },
      );
    }

    const existingEnquiry = await db.orm.public.ContactEnquiry
      .where((enquiry) => enquiry.id.eq(enquiryId))
      .first();

    if (!existingEnquiry) {
      return NextResponse.json(
        { error: "Enquiry not found." },
        { status: 404 },
      );
    }

    await db.orm.public.ContactEnquiry
      .where((enquiry) => enquiry.id.eq(enquiryId))
      .update({ status: parsed.data.status });

    return NextResponse.json({
      message: "Enquiry status updated successfully.",
      status: parsed.data.status,
    });
  } catch (error) {
    console.error("Failed to update contact enquiry:", error);

    return NextResponse.json(
      { error: "Unable to update enquiry." },
      { status: 500 },
    );
  }
}
