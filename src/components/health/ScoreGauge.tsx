import { ScoreGaugeChart } from "@/components/charts/ScoreGaugeChart";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

import { StatusBadge } from "./StatusBadge";
import { lightToTone, TrafficLight } from "./trafficLight";

interface ScoreGaugeProps {
  score: number;
  light: TrafficLight;
}

// Per design.md's "never show the score as a black box" rule — explains the
// weighted-average formula behind the number via the standard (?) popover.
const SCORE_EXPLANATION =
  "คะแนนนี้คำนวณจาก 3 อัตราส่วนทางการเงิน ถ่วงน้ำหนักรวมกันเป็นคะแนนเดียว (0-100) ได้แก่ อัตราการออม (Savings Rate) 35%, DSR หรือสัดส่วนภาระหนี้ต่อรายได้ 35%, และเงินสำรองฉุกเฉิน (Emergency Fund) 30%";

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
      <div className="flex items-center gap-1.5">
        <h2 className="text-lg font-semibold text-ink">คะแนนสุขภาพการเงิน</h2>
        <InfoTooltip label={SCORE_EXPLANATION} />
      </div>
      <ScoreGaugeChart score={score} color={RING_COLOR[light]} />
      <StatusBadge tone={tone} label={STATUS_TEXT[light]} />
    </div>
  );
}
