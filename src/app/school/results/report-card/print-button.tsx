"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-semibold text-white"
    >
      Print / Save PDF
    </button>
  );
}
