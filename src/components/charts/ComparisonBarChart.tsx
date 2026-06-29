"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { Money } from "@/domain/model/Money";

import { usePrefersReducedMotion } from "@/components/ui/usePrefersReducedMotion";

interface ComparisonBarChartProps {
  income: number;
  expense: number;
  debt: number;
  remaining: number;
}

const TONE_COLORS = {
  income: "var(--color-cat-income-chart)",
  expense: "var(--color-cat-expense-chart)",
  debt: "var(--color-cat-debt-chart)",
} as const;

/**
 * Income/expense/debt/remaining comparison bar chart. Uses the brighter
 * `--color-cat-*-chart` variants of the Cash Flow form's category hues —
 * decorative fills only (no text/icon drawn on top), so they're exempt from
 * the AA audit that covers the base `--color-cat-*` tokens. Remaining
 * follows the sign of its value (income hue if >=0, expense hue if negative).
 */
export function ComparisonBarChart({ income, expense, debt, remaining }: ComparisonBarChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const data = [
    { label: "รายรับ", value: income, tone: "income" as const },
    { label: "รายจ่าย", value: expense, tone: "expense" as const },
    { label: "หนี้สิน", value: debt, tone: "debt" as const },
    { label: "เหลือ", value: remaining, tone: remaining >= 0 ? ("income" as const) : ("expense" as const) },
  ];

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 28, right: 16, bottom: 0, left: 0 }}>
          <XAxis dataKey="label" tick={{ fill: "var(--color-ink-muted)", fontSize: 13 }} />
          <YAxis tick={{ fill: "var(--color-ink-subtle)", fontSize: 12 }} width={48} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={!prefersReducedMotion}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={TONE_COLORS[entry.tone]} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(value: string | number | boolean | null | undefined) =>
                Money.format(Number(value ?? 0))
              }
              fill="var(--color-ink)"
              fontSize={12}
              fontWeight={600}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
