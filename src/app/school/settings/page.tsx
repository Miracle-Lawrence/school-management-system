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
    <div className="mx-auto w-full max-w-5xl space-y-6 px-2 sm:px-4">
      {/* Page heading */}
      <div>
        <p className="text-sm font-semibold text-blue-600">
          School Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          School Settings
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Manage your school's basic information and contact details.
        </p>
      </div>

      {/* School information */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <h2 className="font-semibold text-slate-900">School Information</h2>

          <p className="mt-1 text-sm text-slate-600">
            Update the information displayed throughout the school portal.
          </p>
        </div>

        <form action={updateSchoolAction} className="p-6 sm:p-8">
          <div className="space-y-8">
            {/* Basic information */}
            <section>
              <div className="mb-5">
                <h3 className="text-base font-semibold text-slate-900">
                  Basic Information
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  Your school's name and primary contact information.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    School Name <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="name"
                    name="name"
                    defaultValue={school.name}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={school.email ?? ""}
                      placeholder="school@example.com"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Phone
                    </label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={school.phone ?? ""}
                      placeholder="08012345678"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Address */}
            <section className="border-t border-slate-200 pt-8">
              <div className="mb-5">
                <h3 className="text-base font-semibold text-slate-900">
                  School Address
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  Enter the school's physical location.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Address
                  </label>

                  <textarea
                    id="address"
                    name="address"
                    defaultValue={school.address ?? ""}
                    rows={4}
                    placeholder="School's physical address"
                    className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="city"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      City
                    </label>

                    <input
                      id="city"
                      name="city"
                      defaultValue={school.city ?? ""}
                      placeholder="e.g. Lagos"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="state"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      State
                    </label>

                    <input
                      id="state"
                      name="state"
                      defaultValue={school.state ?? ""}
                      placeholder="e.g. Lagos"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="country"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Country <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="country"
                      name="country"
                      defaultValue={school.country}
                      required
                      placeholder="e.g. Nigeria"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end border-t border-slate-200 pt-6">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
