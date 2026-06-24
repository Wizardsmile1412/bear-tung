"use client";

import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

interface ScoreGaugeChartProps {
  /** 0-100 health score. */
  score: number;
  /** Ring color as a CSS color value (e.g. `var(--color-good)`), not a Tailwind class. */
  color: string;
  /** Chart box size in px (square). Defaults to 220. */
  size?: number;
}

/**
 * Generic circular gauge primitive (no domain knowledge): a single
 * `RadialBar` over a track, with the score number centered on top via
 * absolute positioning (Recharts has no built-in centered-label support).
 */
export function ScoreGaugeChart({ score, color, size = 220 }: ScoreGaugeChartProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const data = [{ name: "score", value: clamped, fill: color }];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          startAngle={90}
          endAngle={-270}
          innerRadius="75%"
          outerRadius="100%"
          barSize={18}
        >
          <RadialBar
            dataKey="value"
            background={{ fill: "var(--color-surface-sunken)" }}
            cornerRadius={9}
            isAnimationActive={false}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[56px] font-bold leading-[56px] tabular-nums text-ink">{clamped}</span>
        <span className="text-sm text-ink-subtle">/ 100</span>
      </div>
    </div>
  );
}
