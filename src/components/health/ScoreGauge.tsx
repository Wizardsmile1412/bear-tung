import { ScoreGaugeChart } from "@/components/charts/ScoreGaugeChart";

import { StatusBadge } from "./StatusBadge";
import { lightToTone, TrafficLight } from "./trafficLight";

interface ScoreGaugeProps {
  score: number;
  light: TrafficLight;
}

const RING_COLOR: Record<TrafficLight, string> = {
  green: "var(--color-good)",
  yellow: "var(--color-warning)",
  red: "var(--color-danger)",
};

// Encouraging, non-judgmental copy per design.md section 10 (voice & tone) —
// never blames the user, always points toward an action.
const STATUS_TEXT: Record<TrafficLight, string> = {
  green: "สุขภาพการเงินดี รักษาระดับนี้ไว้ต่อไป",
  yellow: "พอใช้ได้ ยังมีจุดที่ปรับปรุงได้ ลองดูรายละเอียดด้านล่าง",
  red: "หนี้หรือรายจ่ายค่อนข้างสูง ลองดูวิธีปรับด้านล่าง",
};

/** Domain-aware composition: the gauge chart + a status badge below it. */
export function ScoreGauge({ score, light }: ScoreGaugeProps) {
  const tone = lightToTone(light);

  return (
    <div className="flex flex-col items-center gap-4">
      <ScoreGaugeChart score={score} color={RING_COLOR[light]} />
      <StatusBadge tone={tone} label={STATUS_TEXT[light]} />
    </div>
  );
}
