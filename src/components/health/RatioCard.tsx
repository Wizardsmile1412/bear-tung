"use client";

import { useState } from "react";

import { RatioResult } from "@/domain/ratios/Ratio";

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

/** One card per `RatioResult` — value, status, and an expandable explanation. */
export function RatioCard({ result }: RatioCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-card border border-outline bg-surface p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-ink">{result.label}</h3>
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
