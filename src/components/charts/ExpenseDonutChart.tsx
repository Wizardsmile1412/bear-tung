"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Money } from "@/domain/model/Money";

import { usePrefersReducedMotion } from "@/components/ui/usePrefersReducedMotion";

export interface ExpenseDonutDatum {
  label: string;
  value: number;
}

interface ExpenseDonutChartProps {
  data: ExpenseDonutDatum[];
}

const SLICE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];

function formatTooltipValue(value: unknown, _name: unknown, item: { payload?: { percent?: number } }) {
  const amount = typeof value === "number" ? value : Number(value) || 0;
  const percent = item.payload?.percent ?? 0;
  return `${Money.format(amount)} บาท (${Math.round(percent * 100)}%)`;
}

/**
 * Generic donut chart primitive (no domain knowledge): renders a `Pie` with
 * an inner radius. Falls back to a plain message when there is no data to
 * show, instead of rendering an empty/broken chart.
 */
export function ExpenseDonutChart({ data }: ExpenseDonutChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0 || total <= 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-ink-subtle">
        ไม่มีข้อมูลรายจ่าย
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.label,
    value: item.value,
    percent: item.value / total,
  }));

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            isAnimationActive={!prefersReducedMotion}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={formatTooltipValue} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
