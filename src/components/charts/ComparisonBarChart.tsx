"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Money } from "@/domain/model/Money";

interface ComparisonBarChartProps {
  income: number;
  expense: number;
  debt: number;
  remaining: number;
}

const BAR_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
];

/**
 * Generic comparison bar chart primitive (no domain knowledge): 4 bars for
 * income / expense / debt / remaining, one category axis. Always uses the
 * neutral chart accent colors — never the traffic-light good/warning/danger
 * colors, which are reserved for money-health status elsewhere.
 */
export function ComparisonBarChart({ income, expense, debt, remaining }: ComparisonBarChartProps) {
  const data = [
    { label: "รายรับ", value: income },
    { label: "รายจ่าย", value: expense },
    { label: "หนี้สิน", value: debt },
    { label: "เหลือ", value: remaining },
  ];

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
          <XAxis dataKey="label" tick={{ fill: "var(--color-ink-muted)", fontSize: 13 }} />
          <YAxis tick={{ fill: "var(--color-ink-subtle)", fontSize: 12 }} width={48} />
          <Tooltip formatter={(value) => Money.formatWithUnit(Number(value))} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
