import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/prisma/db";
import { requireRole } from "@/lib/auth/authorization";
import {
  updateSchoolLoginBranding,
  updateSchoolStatus,
} from "@/lib/services/school.service";
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


async function updateSchoolStatusAction(formData: FormData) {
  "use server";

  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const schoolIdValue = formData.get("schoolId");
  const statusValue = formData.get("status");

  if (typeof schoolIdValue !== "string" || !/^\d+$/.test(schoolIdValue)) {
    throw new Error("Invalid school ID.");
  }

  const schoolId = Number(schoolIdValue);

  if (!Number.isSafeInteger(schoolId) || schoolId <= 0) {
    throw new Error("Invalid school ID.");
  }

  if (
    statusValue !== "ACTIVE" &&
    statusValue !== "SUSPENDED" &&
    statusValue !== "INACTIVE"
  ) {
    throw new Error("Invalid school status.");
  }

  await updateSchoolStatus(schoolId, statusValue);

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

      <div className="mt-6 rounded-lg border bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">School User Management</h2>

            <p className="mt-1 text-sm text-gray-500">
              View and manage School Owner and School Admin accounts associated
              with this school.
            </p>
          </div>

          <Link
            href={`/dashboard/schools/${school.id}/users`}
            className="inline-flex items-center justify-center rounded-md bg-[#0F172A] px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Manage Users →
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold">School Status Management</h2>

        <p className="mt-1 text-sm text-gray-500">
          Control whether this school can access the platform.
        </p>

        <div className="mt-4">
          <span className="text-sm text-gray-500">Current status: </span>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              school.status === "ACTIVE"
                ? "bg-emerald-100 text-emerald-700"
                : school.status === "SUSPENDED"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-700"
            }`}
          >
            {school.status}
          </span>
        </div>

        <form action={updateSchoolStatusAction} className="mt-5">
          <input type="hidden" name="schoolId" value={school.id} />

          <label
            htmlFor="school-status"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Change status
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              id="school-status"
              name="status"
              defaultValue={school.status}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm sm:max-w-xs"
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <button
              type="submit"
              className="rounded-md bg-[#0F172A] px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              Update Status
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Suspended or inactive schools should not be able to log in. Verify
            that your authentication checks enforce this restriction.
          </p>
        </form>
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
