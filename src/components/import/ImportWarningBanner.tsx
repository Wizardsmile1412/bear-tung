"use client";

import { useEffect, useState } from "react";

import { clearImportWarnings, peekImportWarnings } from "./importWarnings";

/**
 * Non-blocking banner shown once on the Cash Flow page after an import that
 * produced warnings (e.g. future carry-forward changes that couldn't be fully
 * recovered). Renders nothing when there are none.
 *
 * Reads the warnings in a lazy initializer (this is a client component that
 * only ever mounts after the page's `isLoaded` gate, so the read never runs
 * during SSR) and clears them in an effect — so a refresh doesn't re-show
 * them, while keeping the read side-effect-free (no setState in the effect).
 */
export function ImportWarningBanner() {
  const [warnings] = useState<string[]>(peekImportWarnings);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    clearImportWarnings();
  }, []);

  if (dismissed || warnings.length === 0) {
    return null;
  }

  return (
    <div
      role="status"
      className="flex items-start justify-between gap-4 rounded-card border border-warning bg-warning-soft px-5 py-4"
    >
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-ink">นำเข้าข้อมูลแล้ว — มีข้อควรตรวจสอบ</p>
        <ul className="list-disc pl-5 text-sm text-ink-muted">
          {warnings.map((warning, index) => (
            <li key={index}>{warning}</li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="ปิด"
        className="shrink-0 rounded-button px-2 text-lg leading-none text-ink-muted transition-colors hover:text-ink"
      >
        ×
      </button>
    </div>
  );
}
