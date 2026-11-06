import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/prisma/db";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(30).optional(),
  service: z.enum([
    "Website Design & Development",
    "Web Application & Software",
    "Website Maintenance",
    "Website Security",
    "Other / Not Sure Yet",
  ]),
  message: z.string().trim().min(10).max(5000),
});

export async function POST(request: Request) {
  const redirectTo = (status: "success" | "error") =>
    NextResponse.redirect(
      new URL(`/?contact=${status}#contact`, request.url),
      303,
    );

  try {
    const formData = await request.formData();

    const parsed = contactSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      service: formData.get("service"),
      message: formData.get("message"),
    });

    if (!parsed.success) {
      return redirectTo("error");
    }

    const { name, email, phone, service, message } = parsed.data;

    await db.orm.public.ContactEnquiry.create({
      name,
      email,
      phone: phone || null,
      service,
      message,
      status: "NEW",
    });

    return redirectTo("success");
  } catch (error) {
    console.error("Failed to save MLOEXA contact enquiry:", error);
    return redirectTo("error");
  }
}
