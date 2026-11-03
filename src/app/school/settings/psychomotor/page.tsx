import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import {
  deletePsychomotorField,
  deletePsychomotorRatingOption,
  getPsychomotorFields,
  getPsychomotorRatingOptions,
  updatePsychomotorField,
  updatePsychomotorRatingOption,
} from "@/lib/services/psychomotor.service";

export default async function PsychomotorSettingsPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    redirect("/login");
  }

  const [fields, ratingOptions] = await Promise.all([
    getPsychomotorFields(schoolId),
    getPsychomotorRatingOptions(schoolId),
  ]);

  const sortedFields = [...fields].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  const sortedRatingOptions = [...ratingOptions].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  async function toggleFieldAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const fieldId = Number(formData.get("fieldId"));

    if (!Number.isInteger(fieldId) || fieldId <= 0) {
      throw new Error("Invalid psychomotor field.");
    }

    const field = await getPsychomotorFields(schoolId).then((items) =>
      items.find((item) => item.id === fieldId),
    );

    if (!field) {
      throw new Error("Psychomotor field not found.");
    }

    await updatePsychomotorField(schoolId, fieldId, {
      name: field.name,
      description: field.description ?? "",
      displayOrder: field.displayOrder,
      isActive: !field.isActive,
    });

    redirect("/school/settings/psychomotor");
  }

  async function deleteFieldAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const fieldId = Number(formData.get("fieldId"));

    if (!Number.isInteger(fieldId) || fieldId <= 0) {
      throw new Error("Invalid psychomotor field.");
    }

    await deletePsychomotorField(schoolId, fieldId);

    redirect("/school/settings/psychomotor");
  }

  async function toggleRatingAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const ratingId = Number(formData.get("ratingId"));

    if (!Number.isInteger(ratingId) || ratingId <= 0) {
      throw new Error("Invalid rating option.");
    }

    const ratingOptions = await getPsychomotorRatingOptions(schoolId);

    const rating = ratingOptions.find((item) => item.id === ratingId);

    if (!rating) {
      throw new Error("Rating option not found.");
    }

    await updatePsychomotorRatingOption(schoolId, ratingId, {
      label: rating.label,
      value: rating.value,
      displayOrder: rating.displayOrder,
      isActive: !rating.isActive,
    });

    redirect("/school/settings/psychomotor");
  }

  async function deleteRatingAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const ratingId = Number(formData.get("ratingId"));

    if (!Number.isInteger(ratingId) || ratingId <= 0) {
      throw new Error("Invalid rating option.");
    }

    await deletePsychomotorRatingOption(schoolId, ratingId);

    redirect("/school/settings/psychomotor");
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-2 py-6 sm:px-4">
      {/* Page heading */}
      <div>
        <Link
          href="/school/settings"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to School Settings
        </Link>

        <p className="mt-5 text-sm font-semibold text-blue-600">
          School Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Psychomotor & Behaviour
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Configure the behaviour and psychomotor fields that will appear on
          student report cards. Each school can define its own fields and rating
          scale.
        </p>
      </div>

      {/* Behaviour / psychomotor fields */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:px-8">
          <div>
            <h2 className="font-semibold text-slate-900">
              Behaviour & Psychomotor Fields
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Define the areas you want teachers to rate for each student.
            </p>
          </div>

          <Link
            href="/school/settings/psychomotor/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Add Field
          </Link>
        </div>

        {sortedFields.length === 0 ? (
          <div className="px-6 py-10 text-center sm:px-8">
            <p className="font-medium text-slate-900">
              No psychomotor fields configured
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Add fields such as Punctuality, Neatness, Leadership,
              Attentiveness, or Cooperation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    #
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Field
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {sortedFields.map((field) => (
                  <tr key={field.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {field.displayOrder}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                      {field.name}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {field.description || "—"}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={
                          field.isActive
                            ? "inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"
                            : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                        }
                      >
                        {field.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/school/settings/psychomotor/${field.id}/edit`}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </Link>

                        <form action={toggleFieldAction}>
                          <input
                            type="hidden"
                            name="fieldId"
                            value={field.id}
                          />

                          <button
                            type="submit"
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            {field.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </form>

                        <form action={deleteFieldAction}>
                          <input
                            type="hidden"
                            name="fieldId"
                            value={field.id}
                          />

                          <button
                            type="submit"
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Rating options */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:px-8">
          <div>
            <h2 className="font-semibold text-slate-900">Rating Scale</h2>

            <p className="mt-1 text-sm text-slate-600">
              Define the rating options teachers can select for each field.
            </p>
          </div>

          <Link
            href="/school/settings/psychomotor/ratings/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Add Rating
          </Link>
        </div>

        {sortedRatingOptions.length === 0 ? (
          <div className="px-6 py-10 text-center sm:px-8">
            <p className="font-medium text-slate-900">
              No rating options configured
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Add options such as Excellent, Very Good, Good, Fair, and Needs
              Improvement.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    #
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rating
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Value
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {sortedRatingOptions.map((rating) => (
                  <tr key={rating.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {rating.displayOrder}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                      {rating.label}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {rating.value}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={
                          rating.isActive
                            ? "inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"
                            : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                        }
                      >
                        {rating.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/school/settings/psychomotor/ratings/${rating.id}/edit`}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </Link>

                        <form action={toggleRatingAction}>
                          <input
                            type="hidden"
                            name="ratingId"
                            value={rating.id}
                          />

                          <button
                            type="submit"
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            {rating.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </form>

                        <form action={deleteRatingAction}>
                          <input
                            type="hidden"
                            name="ratingId"
                            value={rating.id}
                          />

                          <button
                            type="submit"
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Report card note */}
      <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
        <h2 className="text-sm font-semibold text-blue-900">
          How this appears on report cards
        </h2>

        <p className="mt-2 text-sm leading-6 text-blue-800">
          Active fields and rating options will be available when teachers enter
          student psychomotor and behavioural assessments. These ratings are
          displayed separately from academic scores and do not affect the
          student's academic average or grade.
        </p>
      </section>
    </main>
  );
}
