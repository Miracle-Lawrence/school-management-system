import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  role?: string;
  status?: string;
  school?: string;
}>;


async function updateUserStatus(formData: FormData) {
  "use server";

  const session = await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const userIdValue = formData.get("userId");
  const activeValue = formData.get("isActive");

  if (
    typeof userIdValue !== "string" ||
    !/^\d+$/.test(userIdValue) ||
    (activeValue !== "true" && activeValue !== "false")
  ) {
    throw new Error("Invalid account update request.");
  }

  const userId = Number(userIdValue);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error("Invalid user ID.");
  }

  const target = await db.orm.public.User.where((user) =>
    user.id.eq(userId),
  ).first();

  if (!target) {
    throw new Error("User account not found.");
  }

  if (
    target.role === "PLATFORM_OWNER" ||
    target.id === Number(session.user.id)
  ) {
    throw new Error(
      "Platform Owner accounts and your own account cannot be changed here.",
    );
  }

  await db.orm.public.User.where((user) => user.id.eq(userId)).update({
    isActive: activeValue === "true",
    sessionVersion: target.sessionVersion + 1,
  });

  redirect("/dashboard/users");
}


export default async function PlatformUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const selectedRole = params.role ?? "ALL";
  const selectedStatus = params.status ?? "ALL";
  const selectedSchool = params.school ?? "ALL";

  const [users, schools] = await Promise.all([
    db.orm.public.User.all(),
    db.orm.public.School.all(),
  ]);

  const schoolMap = new Map(schools.map((school) => [school.id, school.name]));

  const roles = [...new Set(users.map((user) => user.role))].sort();

  const filteredUsers = users
    .filter((user) => {
      const matchesQuery =
        !query ||
        (user.name ?? "").toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phone ?? "").toLowerCase().includes(query);

      const matchesRole = selectedRole === "ALL" || user.role === selectedRole;

      const matchesStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "ACTIVE" && user.isActive) ||
        (selectedStatus === "INACTIVE" && !user.isActive);

      const matchesSchool =
        selectedSchool === "ALL" ||
        (selectedSchool === "PLATFORM" && user.schoolId === null) ||
        (selectedSchool !== "PLATFORM" &&
          user.schoolId === Number(selectedSchool));

      return matchesQuery && matchesRole && matchesStatus && matchesSchool;
    })
    .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));

  const activeCount = users.filter((user) => user.isActive).length;
  const inactiveCount = users.length - activeCount;
  const schoolAccountCount = users.filter(
    (user) => user.schoolId !== null,
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Platform Dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Platform Users
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View and filter user accounts across all registered schools.
          </p>
        </div>

        <div className="rounded-lg border bg-white px-4 py-3">
          <p className="text-xs text-gray-500">Matching accounts</p>
          <p className="text-2xl font-bold">{filteredUsers.length}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Users" value={users.length} />
        <SummaryCard label="Active Accounts" value={activeCount} />
        <SummaryCard label="Inactive Accounts" value={inactiveCount} />
        <SummaryCard label="School-Assigned Users" value={schoolAccountCount} />
      </div>

      <form
        method="GET"
        className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="lg:col-span-2">
          <label
            htmlFor="q"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Search users
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={params.q}
            placeholder="Name, email, or phone"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="role"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue={selectedRole}
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
          >
            <option value="ALL">All roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="status"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Account status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={selectedStatus}
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="school"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            School assignment
          </label>
          <select
            id="school"
            name="school"
            defaultValue={selectedSchool}
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
          >
            <option value="ALL">All assignments</option>
            <option value="PLATFORM">Platform accounts</option>
            {schools.map((school) => (
              <option key={school.id} value={String(school.id)}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <button
            type="submit"
            className="rounded-md bg-[#0F172A] px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Apply Filters
          </button>
          <Link
            href="/dashboard/users"
            className="rounded-md border px-5 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Clear
          </Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">User Directory</h2>
          <p className="mt-1 text-sm text-gray-500">
            {filteredUsers.length} account(s) match the selected filters.
          </p>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-gray-900">No users found</p>
            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filter selections.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">School</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Last Login</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {user.name || "Unnamed user"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{user.email}</p>
                      {user.phone && (
                        <p className="mt-1 text-xs text-gray-500">
                          {user.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {user.role.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {user.schoolId === null
                        ? "Platform"
                        : (schoolMap.get(user.schoolId) ?? "Unknown school")}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                      {user.lastLoginAt ? String(user.lastLoginAt) : "Never"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                      {String(user.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      {user.role === "PLATFORM_OWNER" ||
                      user.id === Number(/* current session user ID */) ? (
                        <span className="text-xs text-gray-400">
                          Protected account
                        </span>
                      ) : (
                        <form action={updateUserStatus}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input
                            type="hidden"
                            name="isActive"
                            value={user.isActive ? "false" : "true"}
                          />
                          <button
                            type="submit"
                            className={`rounded-md border px-3 py-2 text-xs font-medium ${
                              user.isActive
                                ? "border-red-200 text-red-700 hover:bg-red-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </form>
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
