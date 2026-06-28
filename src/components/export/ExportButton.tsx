"use client";

interface ExportButtonProps {
  onClick(): void;
}

/**
 * Secondary button (design.md "Export Button": secondary style + table icon
 * + label "Export Excel" — the label itself stays in English, per design.md's
 * own example). Reuses the same secondary-button visual conventions as other
 * bordered/surface buttons in the app (e.g. `MonthSlider`'s step buttons).
 */
export function ExportButton({ onClick }: ExportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center gap-2 rounded-button border border-outline bg-surface px-5 text-base font-semibold text-ink transition-colors hover:bg-surface-sunken"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="14" height="14" rx="1.5" />
        <path d="M3 8.5h14M8.5 3v14" />
      </svg>
      <span>Export Excel</span>
    </button>
  );
}
