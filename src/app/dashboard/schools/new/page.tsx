import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/prisma/db";
import { createSchoolSchema } from "@/lib/validation/school";

async function createSchool(formData: FormData) {
  "use server";

  const result = createSchoolSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
  });

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Invalid school data.");
  }

  const data = result.data;

  const existingSchool = await db.orm.public.School.where((school) =>
    school.slug.eq(data.slug),
  ).first();

  if (existingSchool) {
    throw new Error("A school with this slug already exists.");
  }

  await db.orm.public.School.create({
    name: data.name,
    slug: data.slug,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    country: "Nigeria",
    status: "ACTIVE",
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
          Register a new school on the platform.
        </p>
      </div>

      <form
        action={createSchool}
        className="space-y-6 rounded-lg border bg-white p-6"
      >
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
            Email
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
            Phone
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
