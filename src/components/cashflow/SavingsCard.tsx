"use client";

import { NumericField } from "@/components/ui/NumericField";

interface SavingsCardProps {
  savings: number;
  onChange(savings: number): void;
}

/** Single-field card for cumulative savings/cash on hand. */
export function SavingsCard({ savings, onChange }: SavingsCardProps) {
  return (
    <section className="rounded-card border border-outline border-l-4 border-l-primary bg-primary-soft p-6 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-primary text-white">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden
          >
            {/* shield: savings kept safe */}
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </span>
        <h2 className="text-xl font-semibold text-ink">เงินออมสะสม</h2>
      </div>
      <div className="mt-4 flex flex-col gap-1">
        <label htmlFor="savings" className="text-sm font-medium text-ink-muted">
          เงินออม/เงินสดที่มีอยู่ตอนนี้
        </label>
        <div className="flex items-center gap-2">
          <NumericField
            id="savings"
            inputMode="decimal"
            value={savings}
            onChange={onChange}
            className="w-full rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
          />
          <span className="text-xs text-ink-subtle whitespace-nowrap">บาท</span>
        </div>
      </div>
    </section>
  );
}
