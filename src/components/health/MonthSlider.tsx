"use client";

import { formatMonthLabel } from "./formatMonthLabel";

interface MonthSliderProps {
  /** 'YYYY-MM' month keys, in chronological order. */
  months: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  /** Accessible label for the range input. Defaults to the dashboard's wording. */
  ariaLabel?: string;
}

function clampIndex(index: number, maxIndex: number): number {
  return Math.max(0, Math.min(maxIndex, index));
}

/**
 * Generic month scrubber (no domain types beyond plain 'YYYY-MM' strings):
 * a range input + step buttons + a "back to current month" shortcut.
 *
 * Step buttons exist alongside the slider because dragging a range input to
 * an exact value is imprecise on a touch device (this app's primary target
 * is iPad) — stepping one month at a time is often what users actually want.
 */
export function MonthSlider({
  months,
  selectedIndex,
  onChange,
  ariaLabel = "เลือกเดือนที่ต้องการดู",
}: MonthSliderProps) {
  const maxIndex = months.length - 1;
  const isAtCurrentMonth = selectedIndex === 0;

  const handleRangeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  const step = (delta: number) => {
    onChange(clampIndex(selectedIndex + delta, maxIndex));
  };

  return (
    <div className="rounded-card border border-outline bg-surface p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-semibold text-ink tabular-nums">
            {formatMonthLabel(months[selectedIndex])}
          </span>
          {isAtCurrentMonth && (
            <span className="rounded-[999px] bg-primary-soft px-3 py-1 text-sm font-medium text-primary">
              เดือนปัจจุบัน
            </span>
          )}
        </div>

        {!isAtCurrentMonth && (
          <button
            type="button"
            onClick={() => onChange(0)}
            className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            กลับไปเดือนปัจจุบัน
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          aria-label="เดือนก่อนหน้า"
          onClick={() => step(-1)}
          disabled={selectedIndex === 0}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card border border-outline text-ink disabled:opacity-40 hover:bg-surface-sunken transition-colors"
        >
          ◀
        </button>

        <input
          type="range"
          aria-label={ariaLabel}
          min={0}
          max={maxIndex}
          value={selectedIndex}
          onChange={handleRangeChange}
          className="h-11 flex-1 accent-primary"
        />

        <button
          type="button"
          aria-label="เดือนถัดไป"
          onClick={() => step(1)}
          disabled={selectedIndex === maxIndex}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card border border-outline text-ink disabled:opacity-40 hover:bg-surface-sunken transition-colors"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
