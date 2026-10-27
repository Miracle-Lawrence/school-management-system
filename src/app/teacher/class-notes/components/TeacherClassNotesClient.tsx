"use client";

import { useMemo, useState } from "react";

type TeachingOption = {
  classId: number;
  subjectId: number;
  className: string;
  subjectName: string;
};

type ClassNote = {
  id: number;
  classId: number;
  subjectId: number;
  title: string;
  content: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  className: string;
  subjectName: string;
};

type Props = {
  teachingOptions: TeachingOption[];
  initialNotes: ClassNote[];
};

const emptyForm = {
  classId: "",
  subjectId: "",
  title: "",
  content: "",
};

export default function TeacherClassNotesClient({
  teachingOptions,
  initialNotes,
}: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterClass, setFilterClass] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const classOptions = useMemo(() => {
    const unique = new Map<number, string>();

    teachingOptions.forEach((option) => {
      unique.set(option.classId, option.className);
    });

    return Array.from(unique, ([id, name]) => ({ id, name })).sort(
      (a, b) => a.name.localeCompare(b.name),
    );
  }, [teachingOptions]);

  const availableSubjects = useMemo(() => {
    const selectedClassId = Number(form.classId);

    return teachingOptions
      .filter(
        (option) =>
          option.classId === selectedClassId ||
          (editingId !== null && selectedClassId === 0),
      )
      .filter(
        (option, index, array) =>
          array.findIndex(
            (candidate) => candidate.subjectId === option.subjectId,
          ) === index,
      )
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  }, [teachingOptions, form.classId, editingId]);

  const filteredNotes = useMemo(() => {
    const term = search.trim().toLowerCase();

    return notes.filter((note) => {
      const matchesClass =
        filterClass === "all" || note.classId === Number(filterClass);
      const matchesSubject =
        filterSubject === "all" || note.subjectId === Number(filterSubject);
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "published" && note.isPublished) ||
        (filterStatus === "draft" && !note.isPublished);
      const matchesSearch =
        !term ||
        note.title.toLowerCase().includes(term) ||
        note.content.toLowerCase().includes(term) ||
        note.className.toLowerCase().includes(term) ||
        note.subjectName.toLowerCase().includes(term);

      return matchesClass && matchesSubject && matchesStatus && matchesSearch;
    });
  }, [notes, filterClass, filterSubject, filterStatus, search]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEditing(note: ClassNote) {
    setEditingId(note.id);
    setForm({
      classId: String(note.classId),
      subjectId: String(note.subjectId),
      title: note.title,
      content: note.content,
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveNote(publish: boolean) {
    setMessage("");
    setError("");

    if (!form.classId || !form.subjectId) {
      setError("Select a class and subject.");
      return;
    }

    if (!form.title.trim()) {
      setError("Enter a title for the class note.");
      return;
    }

    if (!form.content.trim()) {
      setError("Enter the lesson content.");
      return;
    }

    setBusy(true);

    try {
      const editingNote = notes.find((note) => note.id === editingId);

      const response = await fetch(
        editingId !== null
          ? `/api/teacher/class-notes/${editingId}`
          : "/api/teacher/class-notes",
        {
          method: editingId !== null ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            editingId !== null
              ? {
                  title: form.title,
                  content: form.content,
                  isPublished: publish
                    ? true
                    : editingNote?.isPublished ?? false,
                }
              : {
                  classId: Number(form.classId),
                  subjectId: Number(form.subjectId),
                  title: form.title,
                  content: form.content,
                  isPublished: publish,
                },
          ),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to save the class note.");
      }

      const saved = result.note as ClassNote;
      const selectedOption = teachingOptions.find(
        (option) =>
          option.classId === saved.classId &&
          option.subjectId === saved.subjectId,
      );

      const normalized: ClassNote = {
        ...saved,
        className:
          saved.className ??
          selectedOption?.className ??
          editingNote?.className ??
          "Class",
        subjectName:
          saved.subjectName ??
          selectedOption?.subjectName ??
          editingNote?.subjectName ??
          "Subject",
        publishedAt: saved.publishedAt
          ? String(saved.publishedAt)
          : null,
        createdAt: saved.createdAt ? String(saved.createdAt) : null,
        updatedAt: saved.updatedAt ? String(saved.updatedAt) : null,
      };

      setNotes((current) => {
        const exists = current.some((note) => note.id === normalized.id);

        return exists
          ? current.map((note) =>
              note.id === normalized.id ? normalized : note,
            )
          : [normalized, ...current];
      });

      setMessage(
        publish
          ? "Class note published successfully."
          : editingId !== null
            ? "Class note updated successfully."
            : "Draft saved successfully.",
      );

      resetForm();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "An unexpected error occurred.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function changePublication(note: ClassNote) {
    setMessage("");
    setError("");
    setBusy(true);

    try {
      const response = await fetch(
        `/api/teacher/class-notes/${note.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublished: !note.isPublished }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update publication status.");
      }

      setNotes((current) =>
        current.map((item) =>
          item.id === note.id
            ? {
                ...item,
                isPublished: result.note.isPublished,
                publishedAt: result.note.publishedAt
                  ? String(result.note.publishedAt)
                  : null,
              }
            : item,
        ),
      );

      setMessage(
        !note.isPublished
          ? "Class note published successfully."
          : "Class note returned to draft.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update publication status.",
      );
    } finally {
      setBusy(false);
    }
  }

  const publishedCount = notes.filter((note) => note.isPublished).length;
  const draftCount = notes.length - publishedCount;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-blue-600">
          Teaching &amp; Learning
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Class Notes
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Prepare lesson notes, save drafts, and publish learning materials for
          your assigned classes.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Total notes</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{notes.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm text-emerald-700">Published</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">
            {publishedCount}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-700">Drafts</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{draftCount}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editingId !== null ? "Edit class note" : "Create class note"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {editingId !== null
                ? "Update the content or publication status of your note."
                : "Choose an assigned class and subject before writing."}
            </p>
          </div>
          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel editing
            </button>
          )}
        </div>

        {teachingOptions.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You do not have any assigned class and subject combinations. Contact
            your school administrator.
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void saveNote(false);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Class
                <select
                  required
                  value={form.classId}
                  disabled={editingId !== null || busy}
                  onChange={(event) => {
                    const classId = event.target.value;
                    const firstSubject = teachingOptions.find(
                      (option) => option.classId === Number(classId),
                    );
                    setForm((current) => ({
                      ...current,
                      classId,
                      subjectId: firstSubject
                        ? String(firstSubject.subjectId)
                        : "",
                    }));
                  }}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="">Select a class</option>
                  {classOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Subject
                <select
                  required
                  value={form.subjectId}
                  disabled={editingId !== null || busy || !form.classId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subjectId: event.target.value,
                    }))
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="">Select a subject</option>
                  {availableSubjects.map((option) => (
                    <option
                      key={`${option.classId}-${option.subjectId}`}
                      value={option.subjectId}
                    >
                      {option.subjectName}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Note title
              <input
                required
                maxLength={200}
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="e.g. Introduction to Fractions"
                disabled={busy}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Lesson content
              <textarea
                required
                rows={10}
                maxLength={100000}
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                placeholder="Write the lesson notes here. You can include headings, explanations, examples, and exercises."
                disabled={busy}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-3 leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
              <span className="mt-1 block text-right text-xs text-slate-500">
                {form.content.length.toLocaleString()} / 100,000 characters
              </span>
            </label>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}
            {message && (
              <div
                role="status"
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
              >
                {message}
              </div>
            )}

            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
              <button
                type="submit"
                disabled={busy || teachingOptions.length === 0}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Saving..." : "Save draft"}
              </button>
              <button
                type="button"
                disabled={busy || teachingOptions.length === 0}
                onClick={() => void saveNote(true)}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Saving..." : editingId !== null ? "Save & publish" : "Publish note"}
              </button>
            </div>
          </form>
        )}

        {(error || message) && teachingOptions.length === 0 && (
          <div className="mt-4 text-sm text-slate-600">{error || message}</div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Manage your notes</h2>
          <p className="mt-1 text-sm text-slate-600">
            Search notes and filter them by class, subject, or status.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes..."
              aria-label="Search class notes"
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={filterClass}
              onChange={(event) => setFilterClass(event.target.value)}
              aria-label="Filter by class"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="all">All classes</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>

            <select
              value={filterSubject}
              onChange={(event) => setFilterSubject(event.target.value)}
              aria-label="Filter by subject"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="all">All subjects</option>
              {teachingOptions
                .filter(
                  (option, index, array) =>
                    array.findIndex(
                      (candidate) => candidate.subjectId === option.subjectId,
                    ) === index,
                )
                .map((option) => (
                  <option key={option.subjectId} value={option.subjectId}>
                    {option.subjectName}
                  </option>
                ))}
            </select>

            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              aria-label="Filter by publication status"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <span className="text-xl font-bold">N</span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No class notes found
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Create a note or change your search and filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotes.map((note) => (
              <article
                key={note.id}
                className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {note.title}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        note.isPublished
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {note.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {note.className} · {note.subjectName}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
                    {note.content.length > 240
                      ? `${note.content.slice(0, 240)}…`
                      : note.content}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Created{" "}
                    {note.createdAt
                      ? new Date(note.createdAt).toLocaleDateString()
                      : "recently"}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(note)}
                    disabled={busy}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void changePublication(note)}
                    disabled={busy}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50 ${
                      note.isPublished
                        ? "border border-amber-300 text-amber-700 hover:bg-amber-50"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {note.isPublished ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
