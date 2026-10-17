"use client";

import { useCallback, useEffect, useState } from "react";

type Option = {
  id: number;
  name: string;
  isActive?: boolean;
};

type FeeStructure = {
  id: number;
  categoryId: number;
  classId: number;
  sessionId: number;
  termId: number;
  amount: string | number;
  isMandatory: boolean;
  isActive: boolean;
  category?: { name: string };
  schoolClass?: { name: string };
  session?: { name: string };
  term?: { name: string };
};

type ApiError = { error?: string };

type OptionsResponse = {
  categories: Option[];
  classes: Option[];
  sessions: Option[];
  terms: Option[];
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
});

export default function FeeStructureManager() {
  const [options, setOptions] = useState<OptionsResponse>({
    categories: [],
    classes: [],
    sessions: [],
    terms: [],
  });
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [classId, setClassId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [amount, setAmount] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadStructures = useCallback(async () => {
    const response = await fetch("/api/school/fee-structures", {
      cache: "no-store",
    });
    const data = (await response.json()) as
      { structures?: FeeStructure[] } | ApiError;

    if (!response.ok) {
      throw new Error(
        "error" in data && data.error
          ? data.error
          : "Could not load fee structures.",
      );
    }

    if (!("structures" in data) || !Array.isArray(data.structures)) {
      throw new Error(
        "The server returned an unexpected fee structure response.",
      );
    }

    setStructures(data.structures);
  }, []);

  const loadOptions = useCallback(async () => {
    const response = await fetch("/api/school/fee-structures/options", {
      cache: "no-store",
    });
    const data = (await response.json()) as OptionsResponse | ApiError;

    if (!response.ok) {
      throw new Error(
        "error" in data && data.error
          ? data.error
          : "Could not load form options.",
      );
    }

    if (
      !("categories" in data) ||
      !("classes" in data) ||
      !("sessions" in data) ||
      !("terms" in data)
    ) {
      throw new Error("The server returned unexpected form options.");
    }

    setOptions(data);
  }, []);

  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      await Promise.all([loadOptions(), loadStructures()]);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Could not load fee structures.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadOptions, loadStructures]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  async function handleSessionChange(value: string) {
    setSessionId(value);
    setTermId("");
    setOptions((current) => ({ ...current, terms: [] }));

    if (!value) return;

    setIsLoadingTerms(true);
    setFormError(null);

    try {
      const response = await fetch(
        `/api/school/fee-structures/options?sessionId=${encodeURIComponent(value)}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as OptionsResponse | ApiError;

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error ? data.error : "Could not load terms.",
        );
      }

      if (!("terms" in data) || !Array.isArray(data.terms)) {
        throw new Error("The server returned an unexpected terms response.");
      }

      setOptions((current) => ({ ...current, terms: data.terms }));
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not load terms.",
      );
    } finally {
      setIsLoadingTerms(false);
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/school/fee-structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: Number(categoryId),
          classId: Number(classId),
          sessionId: Number(sessionId),
          termId: Number(termId),
          amount: amount.trim(),
          isMandatory,
          isActive,
        }),
      });

      const data = (await response.json()) as
        { structure?: FeeStructure } | ApiError;

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Could not create the fee structure.",
        );
      }

      await loadStructures();

      setAmount("");
      setTermId("");
      setIsMandatory(true);
      setIsActive(true);
      setSuccessMessage("Fee structure created successfully.");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Could not create the fee structure.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  function getOptionName(
    list: Option[],
    id: number,
    fallback?: string,
  ): string {
    return list.find((item) => item.id === id)?.name ?? fallback ?? `#${id}`;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Add a fee structure
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Assign an amount to a fee category, class, session, and term.
        </p>

        {isLoading ? (
          <p className="mt-5 text-sm text-slate-600">Loading form options...</p>
        ) : loadError ? (
          <p role="alert" className="mt-5 text-sm text-red-700">
            {loadError}
          </p>
        ) : (
          <form onSubmit={handleCreate} className="mt-5 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="fee-category"
                  className="block text-sm font-medium text-slate-700"
                >
                  Fee category
                </label>
                <select
                  id="fee-category"
                  required
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Select category</option>
                  {options.categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="fee-class"
                  className="block text-sm font-medium text-slate-700"
                >
                  Class
                </label>
                <select
                  id="fee-class"
                  required
                  value={classId}
                  onChange={(event) => setClassId(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Select class</option>
                  {options.classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="fee-session"
                  className="block text-sm font-medium text-slate-700"
                >
                  Academic session
                </label>
                <select
                  id="fee-session"
                  required
                  value={sessionId}
                  onChange={(event) =>
                    void handleSessionChange(event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">Select session</option>
                  {options.sessions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="fee-term"
                  className="block text-sm font-medium text-slate-700"
                >
                  Term
                </label>
                <select
                  id="fee-term"
                  required
                  value={termId}
                  onChange={(event) => setTermId(event.target.value)}
                  disabled={!sessionId || isLoadingTerms}
                  className={inputClass}
                >
                  <option value="">
                    {isLoadingTerms ? "Loading terms..." : "Select term"}
                  </option>
                  {options.terms.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="max-w-sm">
              <label
                htmlFor="fee-amount"
                className="block text-sm font-medium text-slate-700"
              >
                Amount (NGN)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  ₦
                </span>
                <input
                  id="fee-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="e.g. 75000.00"
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isMandatory}
                  onChange={(event) => setIsMandatory(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Mandatory fee
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Active
              </label>
            </div>

            {options.categories.length === 0 && (
              <p className="text-sm text-amber-700">
                Create an active fee category before adding a fee structure.
              </p>
            )}

            {options.classes.length === 0 && (
              <p className="text-sm text-amber-700">
                Create a class before adding a fee structure.
              </p>
            )}

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
              disabled={
                isCreating ||
                isLoadingTerms ||
                !categoryId ||
                !classId ||
                !sessionId ||
                !termId ||
                !amount ||
                Number(amount) <= 0
              }
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? "Saving..." : "Create fee structure"}
            </button>
          </form>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Existing fee structures
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Fees configured for your school.
            </p>
          </div>
          {!isLoading && !loadError && (
            <p className="text-sm text-slate-500">
              {structures.length}{" "}
              {structures.length === 1 ? "structure" : "structures"}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Loading fee structures...
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-white p-6">
            <p role="alert" className="text-sm text-red-700">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => void loadPageData()}
              className="mt-3 text-sm font-semibold text-blue-700 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : structures.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h3 className="font-semibold text-slate-800">
              No fee structures yet
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Add your first fee structure using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Session</th>
                  <th className="px-4 py-3 font-semibold">Term</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Requirement</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {structures.map((item) => (
                  <tr key={item.id} className="text-slate-700">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                      {item.category?.name ??
                        getOptionName(options.categories, item.categoryId)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {item.schoolClass?.name ??
                        getOptionName(options.classes, item.classId)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {item.session?.name ??
                        getOptionName(options.sessions, item.sessionId)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {item.term?.name ?? `Term #${item.termId}`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                      {naira.format(Number(item.amount))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {item.isMandatory ? "Mandatory" : "Optional"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
