import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/prisma/db";
import { requireRole } from "@/lib/auth/authorization";
import { updateSchoolLoginBranding } from "@/lib/services/school.service";
import { saveSchoolLogo, saveSchoolLoginImage } from "@/lib/utils/file-upload";

import SchoolLoginBrandingForm from "./components/school-login-branding-form";

const brandingSchema = z.object({
  motto: z.string().max(200).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

async function updateSchoolLoginBrandingAction(formData: FormData) {
  "use server";

  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const schoolIdValue = formData.get("schoolId");

  if (typeof schoolIdValue !== "string") {
    throw new Error("School ID is required.");
  }

  const schoolId = Number(schoolIdValue);

  if (!Number.isInteger(schoolId)) {
    throw new Error("Invalid school ID.");
  }

  const result = brandingSchema.safeParse({
    motto: formData.get("motto") || undefined,
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    accentColor: formData.get("accentColor"),
  });

  if (!result.success) {
    throw new Error("Invalid branding settings.");
  }

  const logo = formData.get("logo");
  const loginImage = formData.get("loginImage");

  let logoUrl: string | undefined;
  let loginImageUrl: string | undefined;

  if (logo instanceof File && logo.size > 0) {
    logoUrl = await saveSchoolLogo(logo, schoolId);
  }

  if (loginImage instanceof File && loginImage.size > 0) {
    loginImageUrl = await saveSchoolLoginImage(loginImage, schoolId);
  }

  await updateSchoolLoginBranding(schoolId, {
    motto: result.data.motto,
    primaryColor: result.data.primaryColor,
    secondaryColor: result.data.secondaryColor,
    accentColor: result.data.accentColor,
    ...(logoUrl ? { logoUrl } : {}),
    ...(loginImageUrl ? { loginImageUrl } : {}),
  });

  redirect(`/dashboard/schools/${schoolId}`);
}

export default async function SchoolDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const { id } = await params;
  const schoolId = Number(id);

  if (!Number.isInteger(schoolId)) {
    notFound();
  }

  const school = await db.orm.public.School.where((school) =>
    school.id.eq(schoolId),
  ).first();

  if (!school) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/dashboard/schools"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back to Schools
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-bold">{school.name}</h1>

          <p className="mt-1 text-sm text-gray-500">
            School details and platform management.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold">School Information</h2>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              School Name
            </p>
            <p className="mt-1">{school.name}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">Slug</p>
            <p className="mt-1">{school.slug}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">Email</p>
            <p className="mt-1">{school.email ?? "—"}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">Phone</p>
            <p className="mt-1">{school.phone ?? "—"}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">City</p>
            <p className="mt-1">{school.city ?? "—"}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">State</p>
            <p className="mt-1">{school.state ?? "—"}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Country
            </p>
            <p className="mt-1">{school.country}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Status
            </p>
            <p className="mt-1">{school.status}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-medium uppercase text-gray-500">Address</p>
          <p className="mt-1">{school.address ?? "—"}</p>
        </div>
      </div>

      <form action={updateSchoolLoginBrandingAction}>
        <input type="hidden" name="schoolId" value={school.id} />
        <SchoolLoginBrandingForm
          schoolName={school.name}
          motto={school.motto ?? ""}
          logoUrl={school.logoUrl ?? ""}
          loginImageUrl={school.loginImageUrl ?? ""}
          primaryColor={school.primaryColor ?? "#1D4ED8"}
          secondaryColor={school.secondaryColor ?? "#0F172A"}
          accentColor={school.accentColor ?? "#16A34A"}
        />
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Save Login Branding
          </button>
        </div>
      </form>
    </div>
  );
}
