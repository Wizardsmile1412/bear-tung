"use client";

import { useState } from "react";

interface ResetButtonProps {
  onReset(): void;
}

/**
 * Destructive action: clears the whole CashFlowProfile (all line items +
 * savings). There's no undo since data only lives in localStorage, so this
 * requires an inline confirm step before firing instead of acting on the
 * first click.
 */
export function ResetButton({ onReset }: ResetButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-ink-muted">ยืนยันการล้างข้อมูลทั้งหมด?</span>
        <button
          type="button"
          onClick={() => {
            onReset();
            setConfirming(false);
          }}
          className="inline-flex h-9 items-center rounded-button bg-danger px-4 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          ยืนยัน
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="inline-flex h-9 items-center rounded-button border border-outline bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-sunken"
        >
          ยกเลิก
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex h-9 items-center rounded-button border border-danger px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger-soft"
    >
      ล้างข้อมูลทั้งหมด
    </button>
  );
}
