"use client";

import { useActionState } from "react";
import {
  createAssessmentCategoryAction,
  updateAssessmentCategoryAction,
  deactivateAssessmentCategoryAction,
  type AssessmentCategoryActionState,
} from "./actions";

const initialActionState: AssessmentCategoryActionState = {
  error: null,
  success: null,
};

type AssessmentCategoryType =
  "ASSIGNMENT" | "TEST" | "CA" | "EXAM" | "PROJECT" | "PRACTICAL" | "OTHER";

type AssessmentCategory = {
  id: number;
  name: string;
  type: AssessmentCategoryType;
  displayOrder: number;
  isActive: boolean;
};

type Props = {
  categories: AssessmentCategory[];
};

const categoryTypes: AssessmentCategoryType[] = [
  "ASSIGNMENT",
  "TEST",
  "CA",
  "EXAM",
  "PROJECT",
  "PRACTICAL",
  "OTHER",
];

function ActionMessage({
  error,
  success,
}: {
  error: string | null;
  success: string | null;
}) {
  return (
    <>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-2 text-sm text-green-700">
          {success}
        </p>
      )}
    </>
  );
}

function CategoryEditRow({ category }: { category: AssessmentCategory }) {
  const updateAction = updateAssessmentCategoryAction.bind(null, category.id);
  const [updateState, updateFormAction, isUpdating] = useActionState(
    updateAction,
    initialActionState,
  );

  const deactivateAction = deactivateAssessmentCategoryAction.bind(
    null,
    category.id,
  );
  const [deactivateState, deactivateFormAction, isDeactivating] =
    useActionState(deactivateAction, initialActionState);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-900">{category.name}</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            category.isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {category.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <form action={updateFormAction} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label
              htmlFor={`name-${category.id}`}
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Category name
            </label>
            <input
              id={`name-${category.id}`}
              name="name"
              type="text"
              required
              maxLength={100}
              defaultValue={category.name}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor={`type-${category.id}`}
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Assessment type
            </label>
            <select
              id={`type-${category.id}`}
              name="type"
              required
              defaultValue={category.type}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {categoryTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`order-${category.id}`}
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Display order
            </label>
            <input
              id={`order-${category.id}`}
              name="displayOrder"
              type="number"
              min={1}
              step={1}
              required
              defaultValue={category.displayOrder}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isUpdating}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {isUpdating ? "Saving..." : "Save changes"}
        </button>

        <ActionMessage
          error={updateState.error}
          success={updateState.success}
        />
      </form>

      {category.isActive && (
        <form action={deactivateFormAction} className="mt-3 border-t pt-3">
          <button
            type="submit"
            disabled={isDeactivating}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {isDeactivating ? "Deactivating..." : "Deactivate category"}
          </button>
          <ActionMessage
            error={deactivateState.error}
            success={deactivateState.success}
          />
        </form>
      )}
    </div>
  );
}

export default function CategoryManager({ categories }: Props) {
  const [createState, createFormAction, isCreating] = useActionState(
    createAssessmentCategoryAction,
    initialActionState,
  );

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Create assessment category
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Create reusable categories for assessments and report calculations.
        </p>

        <form action={createFormAction} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="new-category-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Category name
              </label>
              <input
                id="new-category-name"
                name="name"
                type="text"
                required
                maxLength={100}
                placeholder="e.g. First CA"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="new-category-type"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Assessment type
              </label>
              <select
                id="new-category-type"
                name="type"
                required
                defaultValue="CA"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
              >
                {categoryTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="new-category-order"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Display order
              </label>
              <input
                id="new-category-order"
                name="displayOrder"
                type="number"
                min={1}
                step={1}
                required
                defaultValue={categories.length + 1}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create category"}
          </button>

          <ActionMessage
            error={createState.error}
            success={createState.success}
          />
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Assessment categories
          </h2>
          <p className="text-sm text-gray-600">
            Categories are ordered by display order. Categories already in use
            may not be deactivated or have their type changed.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="font-medium text-gray-800">
              No assessment categories yet
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Use the form above to create your first category.
            </p>
          </div>
        ) : (
          categories.map((category) => (
            <CategoryEditRow key={category.id} category={category} />
          ))
        )}
      </section>
    </div>
  );
}
