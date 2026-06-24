"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";

import { statusFromScore } from "@/domain/ratios/Ratio";

import { toneLabel } from "@/components/health/trafficLight";

export interface ScoreTrendDatum {
  month: string; // 'YYYY-MM'
  monthLabel: string; // pre-formatted Thai label, e.g. 'มิ.ย. 2026'
  score: number;
}

interface ScoreTrendChartProps {
  data: ScoreTrendDatum[];
  /** The currently-selected month ('YYYY-MM'); renders a reference marker when provided. */
  selectedMonth?: string;
}

// Derives the same good/warning/danger tone the domain's HealthScoreService
// already uses (via `statusFromScore`, same 80/50 thresholds) and looks up
// the short Thai status word through the single shared mapping in
// `trafficLight.ts` — the same one `RatioCard` uses — instead of keeping a
// 3rd, separately-threshold-keyed copy of "score -> ดี/พอใช้/ต้องระวัง" here.
function statusLabel(score: number): string {
  return toneLabel(statusFromScore(score));
}

// `Tooltip` (recharts 3.9) is not a generic function — its `content` prop is
// always typed against the library's broad default generics, not narrowed
// to our actual number/string data. Omitting the type args here uses those
// defaults, and we narrow to `ScoreTrendDatum` internally via the payload.
function CustomTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0].payload as ScoreTrendDatum;

  return (
    <div className="rounded-card border border-outline bg-surface px-3 py-2 text-sm shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <p className="font-medium text-ink">{point.monthLabel}</p>
      <p className="mt-1 text-ink-muted">
        คะแนน <span className="font-semibold tabular-nums text-ink">{point.score}</span> — {statusLabel(point.score)}
      </p>
    </div>
  );
}

/**
 * Generic line chart primitive (no domain knowledge beyond plain
 * month/score shapes): plots the health score across the full projection
 * window, with background bands showing the green/yellow/red thresholds
 * the real HealthScoreService uses, and an optional marker for the
 * currently-selected month.
 */
export function ScoreTrendChart({ data, selectedMonth }: ScoreTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-ink-subtle">
        ไม่มีข้อมูลแนวโน้ม
      </div>
    );
  }

  // With up to 60 points, showing every tick would be an illegible wall of
  // text — thin ticks down to roughly 8-10 labels across the full range.
  const tickInterval = Math.max(0, Math.ceil(data.length / 10) - 1);
  const selectedDatum = data.find((d) => d.month === selectedMonth);

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline)" vertical={false} />

          <ReferenceArea y1={0} y2={50} fill="var(--color-danger-soft)" fillOpacity={0.5} stroke="none" ifOverflow="visible" />
          <ReferenceArea y1={50} y2={80} fill="var(--color-warning-soft)" fillOpacity={0.5} stroke="none" ifOverflow="visible" />
          <ReferenceArea y1={80} y2={100} fill="var(--color-good-soft)" fillOpacity={0.5} stroke="none" ifOverflow="visible" />

          <XAxis
            dataKey="monthLabel"
            interval={tickInterval}
            tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }}
          />
          <YAxis domain={[0, 100]} tick={{ fill: "var(--color-ink-subtle)", fontSize: 12 }} width={36} />

          <Tooltip content={CustomTooltip} />

          {selectedDatum && (
            <ReferenceLine
              x={selectedDatum.monthLabel}
              stroke="var(--color-ink-muted)"
              strokeDasharray="4 4"
              ifOverflow="visible"
            />
          )}

          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
