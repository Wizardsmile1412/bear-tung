"use client";

import { useRef, useState } from "react";

import { ImportSummary, useImport } from "./useImport";

interface ImportButtonProps {
  /**
   * When true, the user has existing data, so an inline confirm step is shown
   * before importing (import replaces everything and there's no undo —
   * localStorage only).
   */
  confirmReplace: boolean;
  /** Called after a successful import, with the import summary. */
  onImported(summary: ImportSummary): void;
}

type Status = { kind: "idle" } | { kind: "importing" } | { kind: "error"; message: string };

/**
 * Secondary-style button that imports a previously-exported Bear-tung Excel
 * file. Reuses the inline-confirm pattern from `ResetButton` for the
 * destructive "replace existing data" case, and reports failures inline
 * without ever wiping the current profile (the hook only replaces data once
 * the file is recognized).
 */
export function ImportButton({ confirmReplace, onImported }: ImportButtonProps) {
  const { importFromFile } = useImport();
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function openFilePicker() {
    setConfirming(false);
    inputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset the input so picking the same file again still fires onChange.
    event.target.value = "";
    if (!file) {
      return;
    }

    setStatus({ kind: "importing" });
    try {
      const summary = await importFromFile(file);
      setStatus({ kind: "idle" });
      onImported(summary);
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "นำเข้าไม่สำเร็จ" });
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        className="hidden"
        data-testid="import-file-input"
      />

      {confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-muted">การนำเข้าจะแทนที่ข้อมูลปัจจุบันทั้งหมด ยืนยันหรือไม่?</span>
          <button
            type="button"
            onClick={openFilePicker}
            className="inline-flex h-9 items-center rounded-button bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            เลือกไฟล์
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="inline-flex h-9 items-center rounded-button border border-outline bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-sunken"
          >
            ยกเลิก
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => (confirmReplace ? setConfirming(true) : openFilePicker())}
          disabled={status.kind === "importing"}
          className="inline-flex h-11 items-center gap-2 rounded-button border border-outline bg-surface px-5 text-base font-semibold text-ink transition-colors hover:bg-surface-sunken disabled:opacity-60"
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
            <path d="M10 13V3M6.5 6.5 10 3l3.5 3.5M4 13v3.5h12V13" />
          </svg>
          <span>{status.kind === "importing" ? "กำลังนำเข้า..." : "Import Excel"}</span>
        </button>
      )}

      {status.kind === "error" && <p className="text-sm font-medium text-danger">{status.message}</p>}
    </div>
  );
}
