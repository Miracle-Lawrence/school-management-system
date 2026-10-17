"use client";

import { useEffect, useState } from "react";

type FeeCategory = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
};

type ApiError = {
  error?: string;
};

export default function FeeCategoryManager() {
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadError(null);

        const response = await fetch("/api/school/fee-categories", {
          cache: "no-store",
        });

        const data = (await response.json()) as
          { categories?: FeeCategory[] } | ApiError;

        if (!response.ok) {
          throw new Error(
            "error" in data && data.error
              ? data.error
              : "Could not load fee categories.",
          );
        }

        if (!("categories" in data) || !Array.isArray(data.categories)) {
          throw new Error("The server returned an unexpected response.");
        }

        setCategories(data.categories);
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not load fee categories.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadCategories();
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormError(null);
    setSuccessMessage(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/school/fee-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      const data = (await response.json()) as
        { category?: FeeCategory; message?: string } | ApiError;

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Could not create the fee category.",
        );
      }

      if (!("category" in data) || !data.category) {
        throw new Error("The server did not return the created category.");
      }

      setCategories((current) =>
        [...current, data.category!].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );

      setName("");
      setDescription("");
      setSuccessMessage(data.message ?? "Fee category created.");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Could not create the fee category.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Add a fee category
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Give the fee a clear name. You can add a short description if needed.
        </p>

        <form onSubmit={handleCreate} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="fee-category-name"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Category name
              </label>

              <input
                id="fee-category-name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Tuition Fee"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="fee-category-description"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Description{" "}
                <span className="font-normal text-slate-500">(optional)</span>
              </label>

              <input
                id="fee-category-description"
                name="description"
                type="text"
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What does this fee cover?"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-sm text-red-600">
              {formError}
            </p>
          )}

          {successMessage && (
            <p role="status" className="text-sm text-green-700">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isCreating || name.trim().length < 2}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? "Creating…" : "Create fee category"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Existing categories
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Categories configured for your school.
            </p>
          </div>

          {!isLoading && !loadError && (
            <p className="text-sm text-slate-500">
              {categories.length}{" "}
              {categories.length === 1 ? "category" : "categories"}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Loading fee categories…
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-white p-6">
            <p role="alert" className="text-sm text-red-700">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 text-sm font-semibold text-blue-700 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h3 className="font-semibold text-slate-800">
              No fee categories yet
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Add your first category using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-100">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-medium text-slate-900">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="mt-1 text-sm text-slate-600">
                        {category.description}
                      </p>
                    )}
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      category.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {category.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
