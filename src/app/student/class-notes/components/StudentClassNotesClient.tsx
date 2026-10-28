"use client";

import { useEffect, useMemo, useState } from "react";

type ClassNote = {
  id: number;
  title: string;
  content: string;
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
  publishedAt: string | null;
  createdAt: string | null;
};

type NotesResponse = {
  notes?: ClassNote[];
  message?: string;
  error?: string;
};

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function StudentClassNotesClient() {
  const [notes, setNotes] = useState<ClassNote[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedNote, setSelectedNote] = useState<ClassNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNotes() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/student/class-notes", {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        const result = (await response.json()) as NotesResponse;

        if (!response.ok) {
          throw new Error(
            result.error || result.message || "Unable to load class notes.",
          );
        }

        if (!cancelled) {
          setNotes(Array.isArray(result.notes) ? result.notes : []);
          setEmptyMessage(result.message || "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading class notes.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadNotes();

    return () => {
      cancelled = true;
    };
  }, []);

  const subjects = useMemo(
    () =>
      Array.from(
        new Map(notes.map((note) => [note.subjectId, note.subjectName])).entries(),
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [notes],
  );

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notes.filter((note) => {
      const matchesSubject =
        selectedSubject === "all" ||
        String(note.subjectId) === selectedSubject;

      const matchesSearch =
        !query ||
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.subjectName.toLowerCase().includes(query);

      return matchesSubject && matchesSearch;
    });
  }, [notes, search, selectedSubject]);

  if (selectedNote) {
    return (
      <section className="mx-auto max-w-5xl space-y-6">
        <button
          type="button"
          onClick={() => setSelectedNote(null)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <span aria-hidden="true">←</span>
          Back to Class Notes
        </button>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-6 sm:px-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                {selectedNote.subjectName}
              </span>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                {selectedNote.className}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {selectedNote.title}
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              Published{" "}
              {formatDate(selectedNote.publishedAt ?? selectedNote.createdAt)}
            </p>
          </div>

          <div className="px-5 py-7 sm:px-8 sm:py-10">
            <div className="whitespace-pre-wrap break-words text-base leading-8 text-slate-700">
              {selectedNote.content}
            </div>
          </div>

          <div className="border-t border-slate-200 px-5 py-4 sm:px-8">
            <button
              type="button"
              onClick={() => setSelectedNote(null)}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Back to all notes
            </button>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Learning Resources
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Class Notes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Read your teachers&apos; published lesson notes and revise your
            subjects at your own pace.
          </p>
        </div>

        <div className="flex h-20 w-20 shrink-0 items-center justify-center self-start rounded-2xl bg-blue-50 text-4xl sm:self-center">
          📚
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Published Notes</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {loading ? "—" : notes.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Available Subjects</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {loading ? "—" : subjects.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Matching Notes</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {loading ? "—" : filteredNotes.length}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px]">
          <div>
            <label
              htmlFor="class-note-search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Search class notes
            </label>
            <input
              id="class-note-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, subject or content..."
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="class-note-subject"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Filter by subject
            </label>
            <select
              id="class-note-subject"
              value={selectedSubject}
              onChange={(event) => setSelectedSubject(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All subjects</option>
              {subjects.map(([id, name]) => (
                <option key={id} value={String(id)}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
          <div
            className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
            role="status"
            aria-label="Loading class notes"
          />
          <p className="mt-4 text-sm text-slate-500">
            Loading your class notes...
          </p>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5"
        >
          <h2 className="font-semibold text-red-800">
            Unable to load class notes
          </h2>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="text-4xl" aria-hidden="true">
            📖
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            {notes.length === 0
              ? "No published class notes yet"
              : "No matching notes found"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {notes.length === 0
              ? emptyMessage ||
                "Your teachers' published notes will appear here when they become available."
              : "Try another search term or select a different subject."}
          </p>

          {notes.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedSubject("all");
              }}
              className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredNotes.map((note) => (
            <article
              key={note.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {note.subjectName}
                </span>
                <span className="shrink-0 text-xs text-slate-500">
                  {formatDate(note.publishedAt ?? note.createdAt)}
                </span>
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                {note.title}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Class: {note.className}
              </p>

              <p className="mt-4 line-clamp-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                {note.content}
              </p>

              <div className="mt-auto pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNote(note);
                    window.scrollTo({ top: 0, behavior: "smooth" });

                    void fetch("/api/student/content-reads", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                      },
                      body: JSON.stringify({
                        contentType: "CLASS_NOTE",
                        contentId: note.id,
                      }),
                    })
                      .then((response) => {
                        if (!response.ok) {
                          return;
                        }

                        window.dispatchEvent(
                          new Event("student-content-reads-updated"),
                        );
                      })
                      .catch(() => {
                        // Opening the note should still work if tracking fails.
                      });
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Read Full Note
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

