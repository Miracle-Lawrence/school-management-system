import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/authorization";
import {
  createGradeScaleSet,
  getGradeScaleSetsForSchool,
  updateGradeScaleSet,
} from "@/lib/services/grade-scale-set.service";
import { getGradeScales } from "@/lib/services/grade-scale.service";
import { db } from "@/prisma/db";

const createSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(100),
});

const updateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(100),
});

export default async function GradingSetsPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const [sets, configurations] = await Promise.all([
    getGradeScaleSetsForSchool(schoolId),
    db.orm.public.ReportConfiguration.where((item) =>
      item.schoolId.eq(schoolId),
    ).all(),
  ]);

  const bandCounts = await Promise.all(
    sets.map(async (set) => ({
      setId: set.id,
      count: (await getGradeScales(schoolId, set.id)).length,
    })),
  );

  async function createSetAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const result = createSchema.safeParse({
      name: formData.get("name"),
    });

    if (!result.success) {
      throw new Error(result.error.issues[0]?.message ?? "Invalid set name.");
    }

    await createGradeScaleSet({
      schoolId,
      name: result.data.name,
    });

    redirect("/school/settings/grading-sets");
  }

  async function renameSetAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const rawId = String(formData.get("id") ?? "");
    const result = updateSchema.safeParse({
      id: Number(rawId),
      name: formData.get("name"),
    });

    if (!result.success) {
      throw new Error(
        result.error.issues[0]?.message ?? "Invalid grading set details.",
      );
    }

    await updateGradeScaleSet(schoolId, result.data.id, {
      name: result.data.name,
    });

    redirect("/school/settings/grading-sets");
  }

  async function toggleSetAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const id = Number(formData.get("id"));
    const requestedActive = formData.get("isActive") === "true";

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid grading set.");
    }

    await updateGradeScaleSet(schoolId, id, {
      isActive: requestedActive,
    });

    redirect("/school/settings/grading-sets");
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-2 sm:px-4">
      <div>
        <Link
          href="/school/settings"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← School Settings
        </Link>

        <p className="mt-4 text-sm font-semibold text-blue-600">
          Academic Configuration
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Grading Sets
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Create reusable grading scales for your school. Assign a set to a
          report configuration, then manage its grade bands on the grading
          settings page. Reports sharing a set use the same grading bands.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Create a grading set
        </h2>

        <form
          action={createSetAction}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <div className="flex-1">
            <label
              htmlFor="newSetName"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Grading set name
            </label>
            <input
              id="newSetName"
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              placeholder="e.g. Primary School Grading"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="sm:self-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
            >
              Create set
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Existing grading sets
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {sets.length} grading set{sets.length === 1 ? "" : "s"} configured
          </p>
        </div>

        {sets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h3 className="font-semibold text-slate-900">
              No grading sets yet
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Create your first grading set above. You can then add its grade
              bands and assign it to a report configuration.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {sets.map((set) => {
              const bandCount =
                bandCounts.find((item) => item.setId === set.id)?.count ?? 0;

              const assignedConfigurations = configurations.filter(
                (configuration) => configuration.gradeScaleSetId === set.id,
              );

              const activeAssignments = assignedConfigurations.filter(
                (configuration) => configuration.isActive,
              );

              return (
                <article
                  key={set.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {set.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {bandCount} grade band{bandCount === 1 ? "" : "s"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        set.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {set.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    <p>
                      Used by {assignedConfigurations.length} report
                      configuration
                      {assignedConfigurations.length === 1 ? "" : "s"}.
                    </p>
                    {activeAssignments.length > 0 && (
                      <p className="mt-1">
                        {activeAssignments.length} active configuration
                        {activeAssignments.length === 1 ? "" : "s"} currently
                        use this set.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/school/settings/grading?gradeScaleSetId=${set.id}`}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Manage grade bands
                    </Link>
                  </div>

                  <form
                    action={renameSetAction}
                    className="mt-5 border-t border-slate-100 pt-4"
                  >
                    <input type="hidden" name="id" value={set.id} />
                    <label
                      htmlFor={`name-${set.id}`}
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Rename set
                    </label>
                    <div className="flex gap-2">
                      <input
                        id={`name-${set.id}`}
                        name="name"
                        type="text"
                        defaultValue={set.name}
                        required
                        minLength={2}
                        maxLength={100}
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Save
                      </button>
                    </div>
                  </form>

                  <form action={toggleSetAction} className="mt-3">
                    <input type="hidden" name="id" value={set.id} />
                    <input
                      type="hidden"
                      name="isActive"
                      value={String(!set.isActive)}
                    />
                    <button
                      type="submit"
                      className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900"
                    >
                      {set.isActive ? "Deactivate set" : "Activate set"}
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
