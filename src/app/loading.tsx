export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-5">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />

        <h1 className="mt-6 text-lg font-extrabold text-slate-900">
          Loading your workspace
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Please wait while we prepare everything for you.
        </p>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          SchoolMS
        </p>
      </div>
    </main>
  );
}
