"use client";

import { MonthlyTotals } from "@/domain/model/CashFlowProfile";
import { Money } from "@/domain/model/Money";

interface CashFlowSummaryCardProps {
  totals: MonthlyTotals;
}

/**
 * Top-of-page summary of the current month's cash flow. Background switches to
 * the traffic-light good/danger tone based on the sign of remainingCashFlow —
 * a genuine good/bad signal, so color is paired with a status icon + the signed
 * figure (design.md §9: color is never the sole signal).
 */
export function CashFlowSummaryCard({ totals }: CashFlowSummaryCardProps) {
  const { totalIncome, totalExpense, totalDebt, remainingCashFlow } = totals;
  const isPositive = remainingCashFlow >= 0;

  const theme = isPositive
    ? { card: "bg-good-soft", border: "border-l-good", chip: "bg-good", accent: "text-good" }
    : { card: "bg-danger-soft", border: "border-l-danger", chip: "bg-danger", accent: "text-danger" };
  const statusLabel = isPositive ? "คงเหลือเป็นบวก" : "คงเหลือติดลบ";

  return (
    <section
      className={`rounded-card border border-outline border-l-4 ${theme.border} ${theme.card} p-6 shadow-card`}
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-input ${theme.chip} text-white`}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            role="img"
            aria-label={statusLabel}
          >
            {isPositive ? (
              // check: healthy surplus
              <polyline points="20 6 9 17 4 12" />
            ) : (
              // alert: spending exceeds income
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </>
            )}
          </svg>
        </span>
        <h2 className="text-xl font-semibold text-ink">สภาพคล่องปัจจุบัน</h2>
      </div>

      <dl className="mt-4 flex flex-col gap-2">
        <SummaryRow label="รายรับ / เดือน" value={totalIncome} />
        <SummaryRow label="รายจ่าย / เดือน" value={totalExpense} />
        <SummaryRow label="หนี้สิน / เดือน" value={totalDebt} />
        <div className="mt-1 flex items-center justify-between border-t border-outline pt-3">
          <dt className="text-base font-semibold text-ink">คงเหลือ / เดือน</dt>
          <dd className={`text-xl font-bold tabular-nums ${theme.accent}`}>
            {Money.formatWithUnit(remainingCashFlow)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm font-medium text-ink-muted">{label}</dt>
      <dd className="text-base font-semibold text-ink tabular-nums">{Money.formatWithUnit(value)}</dd>
    </div>
  );
}
