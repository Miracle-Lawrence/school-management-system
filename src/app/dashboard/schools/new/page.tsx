import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/prisma/db";
import { hashPassword } from "@/lib/auth/password";
import { createSchoolSchema } from "@/lib/validation/school";
import { createSchoolOwnerSchema } from "@/lib/validation/school-owner";

async function createSchool(formData: FormData) {
  "use server";

  const session = await auth();

  if (
    !session?.user ||
    !["PLATFORM_OWNER", "PLATFORM_ADMIN"].includes(session.user.role)
  ) {
    throw new Error("Unauthorized.");
  }

  const schoolResult = createSchoolSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
  });

  if (!schoolResult.success) {
    throw new Error(
      schoolResult.error.issues[0]?.message ?? "Invalid school data.",
    );
  }

  const ownerResult = createSchoolOwnerSchema.safeParse({
    name: formData.get("ownerName"),
    email: formData.get("ownerEmail"),
    password: formData.get("ownerPassword"),
  });

  if (!ownerResult.success) {
    throw new Error(
      ownerResult.error.issues[0]?.message ??
        "Invalid school owner information.",
    );
  }

  const schoolData = schoolResult.data;
  const ownerData = ownerResult.data;

  const existingSchool = await db.orm.public.School.where((school) =>
    school.slug.eq(schoolData.slug),
  ).first();

  if (existingSchool) {
    throw new Error("A school with this slug already exists.");
  }

  const existingUser = await db.orm.public.User.where((user) =>
    user.email.eq(ownerData.email),
  ).first();

  if (existingUser) {
    throw new Error("A user with this email already exists.");
  }

  const school = await db.orm.public.School.create({
    name: schoolData.name,
    slug: schoolData.slug,
    email: schoolData.email || null,
    phone: schoolData.phone || null,
    address: schoolData.address || null,
    city: schoolData.city || null,
    state: schoolData.state || null,
    country: "Nigeria",
    status: "ACTIVE",
  });

  const passwordHash = await hashPassword(ownerData.password);

  await db.orm.public.User.create({
    name: ownerData.name,
    email: ownerData.email,
    passwordHash,
    role: "SCHOOL_OWNER",
    schoolId: school.id,
    isActive: true,
  });

  redirect("/dashboard/schools");
}

export default function NewSchoolPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard/schools"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back to Schools
        </Link>

        <h1 className="mt-4 text-2xl font-bold">Add School</h1>

        <p className="mt-1 text-sm text-gray-500">
          Register a new school and its school owner.
        </p>
      </div>

      <form
        action={createSchool}
        className="space-y-6 rounded-lg border bg-white p-6"
      >
        <div>
          <h2 className="text-lg font-semibold">School Information</h2>
          <p className="mt-1 text-sm text-gray-500">
            Basic information about the school.
          </p>
        </div>

        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            School Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Manchester International School"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="slug" className="mb-2 block text-sm font-medium">
            School Slug
          </label>

          <input
            id="slug"
            name="slug"
            type="text"
            required
            placeholder="manchester-international-school"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
          />

          <p className="mt-1 text-xs text-gray-500">
            Use lowercase letters, numbers, and hyphens.
          </p>
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            School Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            placeholder="school@example.com"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-2 block text-sm font-medium">
            School Phone
          </label>

          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="08012345678"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="address" className="mb-2 block text-sm font-medium">
            Address
          </label>

          <input
            id="address"
            name="address"
            type="text"
            placeholder="School address"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className="mb-2 block text-sm font-medium">
              City
            </label>

            <input
              id="city"
              name="city"
              type="text"
              placeholder="Owerri"
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="state" className="mb-2 block text-sm font-medium">
              State
            </label>

            <input
              id="state"
              name="state"
              type="text"
              placeholder="Imo"
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold">School Owner</h2>

          <p className="mt-1 text-sm text-gray-500">
            This account will manage the school after registration.
          </p>
        </div>

        <div>
          <label htmlFor="ownerName" className="mb-2 block text-sm font-medium">
            Owner Name
          </label>

          <input
            id="ownerName"
            name="ownerName"
            type="text"
            required
            placeholder="John Doe"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="ownerEmail"
            className="mb-2 block text-sm font-medium"
          >
            Owner Email
          </label>

          <input
            id="ownerEmail"
            name="ownerEmail"
            type="email"
            required
            placeholder="owner@example.com"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="ownerPassword"
            className="mb-2 block text-sm font-medium"
          >
            Temporary Password
          </label>

          <input
            id="ownerPassword"
            name="ownerPassword"
            type="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
          />
        </div>

        <div className="flex justify-end gap-3 border-t pt-6">
          <Link
            href="/dashboard/schools"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Create School
          </button>
        </div>
      </form>
    </div>
  );
}
