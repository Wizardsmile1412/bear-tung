"use client";

import { useState } from "react";

import { RatioResult } from "@/domain/ratios/Ratio";

import { InfoTooltip } from "@/components/ui/InfoTooltip";

import { formatRatioValue } from "./formatRatioValue";
import { StatusBadge } from "./StatusBadge";
import { toneLabel } from "./trafficLight";

interface RatioCardProps {
  result: RatioResult;
}

// Thai jargon explanations, one per ratio key. Kept as a lookup here (UI
// copy) rather than in the domain layer, which only knows numbers.
const EXPLANATIONS: Record<string, string> = {
  savingsRate:
    "อัตราการออม คือ เงินที่เหลือจากรายรับ หลังหักรายจ่ายและหนี้ทั้งหมด หารด้วยรายรับทั้งหมด ยิ่งสูงยิ่งดี ควรมากกว่า 20% ของรายรับ",
  dsr: "DSR (สัดส่วนภาระหนี้ต่อรายได้) คือ เงินที่ต้องผ่อนหนี้ทุกเดือน หารด้วยรายรับทั้งหมด ธนาคารทั่วไปแนะนำว่าไม่ควรเกิน 40% ของรายรับ",
  emergencyFund:
    "เงินสำรองฉุกเฉิน คือ เงินออมที่มีอยู่ หารด้วยค่าใช้จ่ายและหนี้ต่อเดือน บอกว่าถ้าไม่มีรายได้เข้ามาเลย เงินสำรองจะพอใช้ได้กี่เดือน ควรมีอย่างน้อย 3-6 เดือน",
};

// Thai score-tier breakdowns, one per ratio key — mirrors each Ratio
// subclass's `toScore` thresholds (see e.g. SavingsRateRatio.toScore) so
// users can see exactly how their value maps to the 0-100 score shown on
// the card, not just the ratio's general meaning (already in EXPLANATIONS).
const SCORE_EXPLANATIONS: Record<string, string> = {
  savingsRate:
    "คะแนนคำนวณจากอัตราการออม (ยิ่งสูงยิ่งดี):\n" +
    "• 20% ขึ้นไป → 100 คะแนน\n" +
    "• 10–20% → ไล่ระดับ 60–100 คะแนน\n" +
    "• 0–10% → ไล่ระดับ 30–60 คะแนน\n" +
    "• ติดลบถึง -10% (ใช้จ่ายเกินตัว) → ไล่ระดับ 0–30 คะแนน",
  dsr:
    "คะแนนคำนวณจาก DSR (ยิ่งต่ำยิ่งดี):\n" +
    "• ไม่เกิน 30% → 100 คะแนน\n" +
    "• 30–40% → ไล่ระดับ 70–100 คะแนน\n" +
    "• 40–60% → ไล่ระดับ 30–70 คะแนน\n" +
    "• เกิน 60% → ไล่ลงต่อจนเหลือ 0 คะแนน",
  emergencyFund:
    "คะแนนคำนวณจากจำนวนเดือนที่เงินสำรองฉุกเฉินรองรับได้ (ยิ่งนานยิ่งดี):\n" +
    "• 6 เดือนขึ้นไป → 100 คะแนน\n" +
    "• 3–6 เดือน → ไล่ระดับ 60–100 คะแนน\n" +
    "• 1–3 เดือน → ไล่ระดับ 30–60 คะแนน\n" +
    "• น้อยกว่า 1 เดือน → ไล่ระดับ 0–30 คะแนน",
};

/** One card per `RatioResult` — value, status, and an expandable explanation. */
export function RatioCard({ result }: RatioCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-card border border-outline bg-surface p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-lg font-semibold text-ink">{result.label}</h3>
          <InfoTooltip label={SCORE_EXPLANATIONS[result.key]} />
        </div>
        <StatusBadge tone={result.status} label={toneLabel(result.status)} />
      </div>

      <p className="mt-3 text-3xl font-bold tabular-nums text-ink">{formatRatioValue(result)}</p>

      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((current) => !current)}
        className="mt-4 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
      >
        {isExpanded ? "ซ่อนวิธีคิด" : "ดูวิธีคิด"}
      </button>

      {isExpanded && (
        <p className="mt-3 text-sm text-ink-muted">{EXPLANATIONS[result.key]}</p>
      )}
    </div>
  );
}
