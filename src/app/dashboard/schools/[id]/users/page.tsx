import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/authorization";
import { hashPassword } from "@/lib/auth/password";
import { createSchoolOwnerSchema } from "@/lib/validation/school-owner";
import { db } from "@/prisma/db";

async function createSchoolAdmin(formData: FormData) {
  "use server";

  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const schoolIdValue = formData.get("schoolId");

  if (typeof schoolIdValue !== "string" || !/^\d+$/.test(schoolIdValue)) {
    throw new Error("Invalid school ID.");
  }

  const schoolId = Number(schoolIdValue);

  if (!Number.isSafeInteger(schoolId) || schoolId <= 0) {
    throw new Error("Invalid school ID.");
  }

  const school = await db.orm.public.School.where((item) =>
    item.id.eq(schoolId),
  ).first();

  if (!school) {
    notFound();
  }

  if (school.status !== "ACTIVE") {
    throw new Error("Administrators cannot be added to an inactive school.");
  }

  const validation = createSchoolOwnerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validation.success) {
    throw new Error(
      validation.error.issues[0]?.message ??
        "Invalid administrator information.",
    );
  }

  const { name, email, password } = validation.data;

  const existingUser = await db.orm.public.User.where((user) =>
    user.email.eq(email),
  ).first();

  if (existingUser) {
    throw new Error("A user with this email already exists.");
  }

  const passwordHash = await hashPassword(password);

  await db.orm.public.User.create({
    name,
    email,
    passwordHash,
    role: "SCHOOL_ADMIN",
    schoolId: school.id,
    isActive: true,
  });

  redirect(`/dashboard/schools/${school.id}/users`);
}

async function updateSchoolAdminStatus(formData: FormData) {
  "use server";

  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const schoolIdValue = formData.get("schoolId");
  const userIdValue = formData.get("userId");
  const activeValue = formData.get("isActive");

  if (
    typeof schoolIdValue !== "string" ||
    !/^\d+$/.test(schoolIdValue) ||
    typeof userIdValue !== "string" ||
    !/^\d+$/.test(userIdValue) ||
    (activeValue !== "true" && activeValue !== "false")
  ) {
    throw new Error("Invalid account update request.");
  }

  const schoolId = Number(schoolIdValue);
  const userId = Number(userIdValue);

  if (
    !Number.isSafeInteger(schoolId) ||
    schoolId <= 0 ||
    !Number.isSafeInteger(userId) ||
    userId <= 0
  ) {
    throw new Error("Invalid school or user ID.");
  }

  const school = await db.orm.public.School.where((item) =>
    item.id.eq(schoolId),
  ).first();

  if (!school) {
    notFound();
  }

  const user = await db.orm.public.User.where((item) =>
    item.id.eq(userId),
  ).first();

  if (!user || user.schoolId !== schoolId || user.role !== "SCHOOL_ADMIN") {
    throw new Error("School Admin account not found.");
  }

  await db.orm.public.User.where((item) => item.id.eq(userId)).update({
    isActive: activeValue === "true",
  });

  redirect(`/dashboard/schools/${schoolId}/users`);
}

async function resetSchoolAdminPassword(formData: FormData) {
  "use server";

  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const schoolIdValue = formData.get("schoolId");
  const userIdValue = formData.get("userId");
  const passwordValue = formData.get("password");

  if (
    typeof schoolIdValue !== "string" ||
    !/^\d+$/.test(schoolIdValue) ||
    typeof userIdValue !== "string" ||
    !/^\d+$/.test(userIdValue)
  ) {
    throw new Error("Invalid school or user ID.");
  }

  const schoolId = Number(schoolIdValue);
  const userId = Number(userIdValue);

  if (
    !Number.isSafeInteger(schoolId) ||
    schoolId <= 0 ||
    !Number.isSafeInteger(userId) ||
    userId <= 0
  ) {
    throw new Error("Invalid school or user ID.");
  }

  const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(100, "Password is too long.");

  const passwordResult = passwordSchema.safeParse(passwordValue);

  if (!passwordResult.success) {
    throw new Error(
      passwordResult.error.issues[0]?.message ?? "Invalid password.",
    );
  }

  const school = await db.orm.public.School.where((item) =>
    item.id.eq(schoolId),
  ).first();

  if (!school) {
    notFound();
  }

  const user = await db.orm.public.User.where((item) =>
    item.id.eq(userId),
  ).first();

  if (!user || user.schoolId !== schoolId || user.role !== "SCHOOL_ADMIN") {
    throw new Error("School Admin account not found.");
  }

  
const passwordHash = await hashPassword(passwordResult.data);

await db.orm.public.User.where((item) => item.id.eq(userId)).update({
  passwordHash,
  sessionVersion: user.sessionVersion + 1,
});

redirect(`/dashboard/schools/${schoolId}/users`);

}

export default async function SchoolUsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const { id } = await params;
  const schoolId = Number(id);

  if (!Number.isSafeInteger(schoolId) || schoolId <= 0) {
    notFound();
  }

  const school = await db.orm.public.School.where((item) =>
    item.id.eq(schoolId),
  ).first();

  if (!school) {
    notFound();
  }

  const allUsers = await db.orm.public.User.where((user) =>
    user.schoolId.eq(schoolId),
  ).all();

  const schoolUsers = allUsers
    .filter(
      (user) => user.role === "SCHOOL_OWNER" || user.role === "SCHOOL_ADMIN",
    )
    .sort((a, b) => a.role.localeCompare(b.role));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <Link
          href={`/dashboard/schools/${school.id}`}
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back to School Details
        </Link>

        <h1 className="mt-4 text-2xl font-bold">School Users</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage administrative accounts for {school.name}.
        </p>
      </div>

      <div className="mb-6 rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Create School Admin</h2>

        <p className="mt-1 text-sm text-gray-500">
          Add an administrator who will manage this school.
        </p>

        <form action={createSchoolAdmin} className="mt-5 space-y-4">
          <input type="hidden" name="schoolId" value={school.id} />

          <div>
            <label
              htmlFor="admin-name"
              className="mb-2 block text-sm font-medium"
            >
              Full Name
            </label>
            <input
              id="admin-name"
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              className="w-full rounded-md border px-3 py-2"
              placeholder="Administrator name"
            />
          </div>

          <div>
            <label
              htmlFor="admin-email"
              className="mb-2 block text-sm font-medium"
            >
              Email Address
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border px-3 py-2"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-2 block text-sm font-medium"
            >
              Temporary Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={100}
              autoComplete="new-password"
              className="w-full rounded-md border px-3 py-2"
              placeholder="At least 8 characters"
            />
            <p className="mt-1 text-xs text-gray-500">
              Share this password securely with the administrator.
            </p>
          </div>

          <button
            type="submit"
            disabled={school.status !== "ACTIVE"}
            className="rounded-md bg-[#0F172A] px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create School Admin
          </button>

          {school.status !== "ACTIVE" && (
            <p className="text-sm text-amber-700">
              Activate this school before adding administrators.
            </p>
          )}
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="font-semibold">Administrators</h2>
            <p className="mt-1 text-sm text-gray-500">
              {schoolUsers.length} account(s)
            </p>
          </div>
        </div>

        {schoolUsers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium">No administrative accounts found</p>
            <p className="mt-1 text-sm text-gray-500">
              School Owner and School Admin accounts will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {schoolUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-4">{user.name || "—"}</td>
                    <td className="px-5 py-4">{user.email}</td>
                    <td className="px-5 py-4">
                      {user.role === "SCHOOL_OWNER"
                        ? "School Owner"
                        : "School Admin"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {user.role === "SCHOOL_ADMIN" ? (
                        <div className="flex min-w-48 flex-col gap-3">
                          <form action={updateSchoolAdminStatus}>
                            <input
                              type="hidden"
                              name="schoolId"
                              value={school.id}
                            />
                            <input
                              type="hidden"
                              name="userId"
                              value={user.id}
                            />
                            <input
                              type="hidden"
                              name="isActive"
                              value={user.isActive ? "false" : "true"}
                            />

                            <button
                              type="submit"
                              className={`rounded-md px-3 py-2 text-xs font-medium ${
                                user.isActive
                                  ? "border border-red-200 text-red-700 hover:bg-red-50"
                                  : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              }`}
                            >
                              {user.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </form>

                          <form
                            action={resetSchoolAdminPassword}
                            className="space-y-2"
                          >
                            <input
                              type="hidden"
                              name="schoolId"
                              value={school.id}
                            />
                            <input
                              type="hidden"
                              name="userId"
                              value={user.id}
                            />

                            <label
                              htmlFor={`reset-password-${user.id}`}
                              className="block text-xs font-medium text-gray-600"
                            >
                              New temporary password
                            </label>

                            <input
                              id={`reset-password-${user.id}`}
                              name="password"
                              type="password"
                              required
                              minLength={8}
                              maxLength={100}
                              autoComplete="new-password"
                              placeholder="At least 8 characters"
                              className="w-full rounded-md border px-3 py-2 text-sm"
                            />

                            <button
                              type="submit"
                              className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium hover:bg-gray-50"
                            >
                              Reset Password
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Protected account
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
