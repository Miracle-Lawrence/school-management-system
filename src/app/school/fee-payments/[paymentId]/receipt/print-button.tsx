"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
    >
      Print receipt
    </button>
  );
}
