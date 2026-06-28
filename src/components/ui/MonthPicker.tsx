"use client";

import { useEffect, useId, useRef, useState } from "react";

import { THAI_MONTHS_SHORT, formatMonthLabel } from "@/components/health/formatMonthLabel";

interface MonthPickerProps {
  /** Associates the trigger with an external `<label htmlFor>`. */
  id?: string;
  /** Current month as 'YYYY-MM', or '' when unset. */
  value: string;
  onChange(value: string): void;
  /** Earliest selectable month ('YYYY-MM'); earlier months are disabled. */
  min?: string;
  /** Shown on the trigger when `value` is empty. */
  placeholder?: string;
  /** When true, renders a control to clear the selection back to ''. */
  clearable?: boolean;
}

/** Year/month picker popover (no day grid) styled with the app's design tokens. */
export function MonthPicker({
  id,
  value,
  onChange,
  min,
  placeholder = "เลือกเดือน",
  clearable = false,
}: MonthPickerProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => initialYear(value, min));
  const rootRef = useRef<HTMLDivElement>(null);

  // Dismiss on outside click or Escape while open.
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectedYear = yearOf(value);
  const selectedMonthIndex = monthIndexOf(value);

  // Resync the viewed year to the current selection each time the panel opens,
  // so reopening is predictable (done here rather than in an effect).
  function togglePanel() {
    setIsOpen((open) => {
      if (!open) setViewYear(initialYear(value, min));
      return !open;
    });
  }

  function selectMonth(index: number) {
    onChange(`${viewYear}-${String(index + 1).padStart(2, "0")}`);
    setIsOpen(false);
  }

  function isMonthDisabled(index: number): boolean {
    if (!min) return false;
    // Zero-padded 'YYYY-MM' strings compare correctly with lexicographic <.
    return `${viewYear}-${String(index + 1).padStart(2, "0")}` < min;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={triggerId}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={togglePanel}
        className="flex h-12 w-full items-center justify-between rounded-input border border-outline bg-surface px-4 text-left text-base focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
      >
        <span className={value ? "text-ink" : "text-ink-subtle"}>
          {value ? formatMonthLabel(value) : placeholder}
        </span>
        <CalendarIcon />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="เลือกเดือนและปี"
          className="absolute left-0 z-20 mt-2 w-70 rounded-card border border-outline bg-surface p-4 shadow-card-hover"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="ปีก่อนหน้า"
              onClick={() => setViewYear((year) => year - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-input text-lg text-ink-muted hover:bg-surface-sunken focus:outline-none focus:ring-3 focus:ring-primary-soft"
            >
              ‹
            </button>
            <span className="text-base font-semibold text-ink tabular-nums">{viewYear}</span>
            <button
              type="button"
              aria-label="ปีถัดไป"
              onClick={() => setViewYear((year) => year + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-input text-lg text-ink-muted hover:bg-surface-sunken focus:outline-none focus:ring-3 focus:ring-primary-soft"
            >
              ›
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {THAI_MONTHS_SHORT.map((label, index) => {
              const selected = selectedYear === viewYear && selectedMonthIndex === index;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={isMonthDisabled(index)}
                  aria-pressed={selected}
                  onClick={() => selectMonth(index)}
                  className={`h-10 rounded-input text-sm font-medium transition-colors focus:outline-none focus:ring-3 focus:ring-primary-soft disabled:cursor-not-allowed disabled:text-ink-faint disabled:hover:bg-transparent ${
                    selected ? "bg-primary text-white" : "text-ink hover:bg-surface-sunken"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {clearable && value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="mt-3 w-full rounded-input py-2 text-sm font-medium text-ink-muted hover:bg-surface-sunken focus:outline-none focus:ring-3 focus:ring-primary-soft"
            >
              ล้างกำหนด
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-5 w-5 text-ink-subtle"
    >
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" strokeLinecap="round" />
    </svg>
  );
}

function initialYear(value: string, min: string | undefined): number {
  return yearOf(value) ?? yearOf(min) ?? new Date().getFullYear();
}

function yearOf(value: string | undefined): number | null {
  if (!value) return null;
  const year = Number(value.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function monthIndexOf(value: string): number | null {
  if (!value) return null;
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12 ? month - 1 : null;
}
