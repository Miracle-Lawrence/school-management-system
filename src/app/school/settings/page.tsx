import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/authorization";
import { updateSchool } from "@/lib/services/school.service";
import { db } from "@/prisma/db";

const updateSchoolSchema = z.object({
  name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(250).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  country: z.string().trim().min(2).max(100),
});

export default async function SchoolSettingsPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const school = await db.orm.public.School.where((school) =>
    school.id.eq(schoolId),
  ).first();

  if (!school) {
    throw new Error("School not found.");
  }

  async function updateSchoolAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const result = updateSchoolSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      city: formData.get("city"),
      state: formData.get("state"),
      country: formData.get("country"),
    });

    if (!result.success) {
      throw new Error(
        result.error.issues[0]?.message || "Invalid school information.",
      );
    }

    await updateSchool(schoolId, result.data);

    redirect("/school/settings");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">School Settings</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage your school's basic information.
        </p>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">School Information</h2>

          <p className="mt-1 text-sm text-gray-500">
            Update the information displayed throughout the school portal.
          </p>
        </div>

        <form action={updateSchoolAction} className="space-y-6 p-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              School Name
            </label>

            <input
              id="name"
              name="name"
              defaultValue={school.name}
              required
              className="mt-2 w-full rounded-md border px-3 py-2"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                defaultValue={school.email ?? ""}
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium">
                Phone
              </label>

              <input
                id="phone"
                name="phone"
                defaultValue={school.phone ?? ""}
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium">
              Address
            </label>

            <textarea
              id="address"
              name="address"
              defaultValue={school.address ?? ""}
              rows={3}
              className="mt-2 w-full rounded-md border px-3 py-2"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="city" className="block text-sm font-medium">
                City
              </label>

              <input
                id="city"
                name="city"
                defaultValue={school.city ?? ""}
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium">
                State
              </label>

              <input
                id="state"
                name="state"
                defaultValue={school.state ?? ""}
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium">
                Country
              </label>

              <input
                id="country"
                name="country"
                defaultValue={school.country}
                required
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
