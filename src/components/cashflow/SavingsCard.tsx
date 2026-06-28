"use client";

interface SavingsCardProps {
  savings: number;
  onChange(savings: number): void;
}

/** Single-field card for cumulative savings/cash on hand. */
export function SavingsCard({ savings, onChange }: SavingsCardProps) {
  return (
    <section className="rounded-card border border-outline bg-surface p-6 shadow-card">
      <h2 className="text-xl font-semibold text-ink">เงินออมสะสม</h2>
      <div className="mt-4 flex flex-col gap-1">
        <label htmlFor="savings" className="text-sm font-medium text-ink-muted">
          เงินออม/เงินสดที่มีอยู่ตอนนี้
        </label>
        <div className="flex items-center gap-2">
          <input
            id="savings"
            type="number"
            inputMode="decimal"
            min={0}
            step="1"
            value={savings}
            onChange={(event) => {
              const value = Number(event.target.value);
              onChange(Number.isFinite(value) && value >= 0 ? value : 0);
            }}
            className="w-full rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
          />
          <span className="text-xs text-ink-subtle whitespace-nowrap">บาท</span>
        </div>
      </div>
    </section>
  );
}
