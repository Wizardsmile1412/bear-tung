"use client";

import { LTV_RELAXATION_END_DATE } from "@/domain/config/defaults";

import { formatMonthLabel } from "@/components/health/formatMonthLabel";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

// Derived from the same `LTV_RELAXATION_END_DATE` ('2026-06-30') the domain's
// `LtvPolicyFactory` uses to pick the policy, so the badge text can never
// drift from the actual rule boundary — e.g. '30 มิ.ย. 2026'.
const [endYear, endMonth, endDay] = LTV_RELAXATION_END_DATE.split("-");
const LTV_RELAXATION_END_LABEL = `${Number(endDay)} ${formatMonthLabel(`${endYear}-${endMonth}`)}`;

interface AssumptionPanelProps {
  interestRatePercent: number;
  onInterestRatePercentChange(value: number): void;
  loanTermYears: number;
  onLoanTermYearsChange(value: number): void;
  /** DSR limit expressed as a 0-100 percent in the UI (converted to a 0-1 fraction by the parent page). */
  dsrLimitPercent: number;
  onDsrLimitPercentChange(value: number): void;
  /**
   * The active LtvPolicy's name from the latest MortgageResult — single
   * source of truth, not computed here. Pass `""` (or omit) when there is no
   * real result yet (e.g. homePrice/borrowerAge not filled in) — the badge
   * then shows a neutral "not yet evaluated" message instead of guessing
   * either rule set, since defaulting to "normal" would misstate which LTV
   * rules are active during the temporary relaxation window.
   */
  ltvPolicyName: string;
}

/**
 * Controlled inputs for the mortgage assumptions the user can adjust
 * (interest rate / term / DSR cap), plus a read-only badge showing which
 * LTV rule set is currently active (driven by `MortgageService`'s result).
 */
export function AssumptionPanel({
  interestRatePercent,
  onInterestRatePercentChange,
  loanTermYears,
  onLoanTermYearsChange,
  dsrLimitPercent,
  onDsrLimitPercentChange,
  ltvPolicyName,
}: AssumptionPanelProps) {
  return (
    <section className="rounded-card border border-outline bg-surface p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <h2 className="text-xl font-semibold text-ink">สมมติฐานการกู้</h2>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <label htmlFor="interestRatePercent" className="text-sm font-medium text-ink-muted">
              อัตราดอกเบี้ย
            </label>
            <InfoTooltip label="อัตราดอกเบี้ยที่ธนาคารคิดต่อปี ใช้คำนวณค่างวดผ่อนบ้านต่อเดือน ค่าเริ่มต้นอ้างอิงจาก MRR ของธนาคารพาณิชย์ไทย ปรับได้ตามจริง" />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="interestRatePercent"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={interestRatePercent}
              onChange={(event) => {
                const value = Number(event.target.value);
                onInterestRatePercentChange(Number.isFinite(value) && value >= 0 ? value : 0);
              }}
              className="w-full rounded-[8px] border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
            />
            <span className="text-xs text-ink-subtle whitespace-nowrap">% ต่อปี</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <label htmlFor="loanTermYears" className="text-sm font-medium text-ink-muted">
              ระยะเวลากู้
            </label>
            <InfoTooltip label="จำนวนปีที่ผ่อนชำระสินเชื่อ ยิ่งระยะเวลานานค่างวดต่อเดือนจะยิ่งต่ำ แต่ดอกเบี้ยรวมจะสูงขึ้น ส่วนใหญ่ธนาคารกำหนดว่าอายุผู้กู้ + ระยะเวลากู้ ต้องไม่เกิน 70 ปี" />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="loanTermYears"
              type="number"
              inputMode="numeric"
              min={1}
              step="1"
              value={loanTermYears}
              onChange={(event) => {
                const value = Number(event.target.value);
                onLoanTermYearsChange(Number.isFinite(value) && value >= 0 ? value : 0);
              }}
              className="w-full rounded-[8px] border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
            />
            <span className="text-xs text-ink-subtle whitespace-nowrap">ปี</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <label htmlFor="dsrLimitPercent" className="text-sm font-medium text-ink-muted">
              DSR สูงสุดที่รับได้
            </label>
            <InfoTooltip label="DSR (สัดส่วนภาระหนี้ต่อรายได้) สูงสุดที่ธนาคารยอมรับ คือเพดานที่ค่างวดผ่อนบ้านรวมกับหนี้อื่น ๆ จะต้องไม่เกินเมื่อเทียบกับรายได้ ธนาคารทั่วไปใช้เกณฑ์ประมาณ 40%" />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="dsrLimitPercent"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="1"
              value={dsrLimitPercent}
              onChange={(event) => {
                const value = Number(event.target.value);
                onDsrLimitPercentChange(Number.isFinite(value) && value >= 0 ? value : 0);
              }}
              className="w-full rounded-[8px] border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
            />
            <span className="text-xs text-ink-subtle whitespace-nowrap">%</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="rounded-[999px] bg-primary-soft px-4 py-2 text-sm font-medium text-primary">
            {ltvPolicyName === "temporary"
              ? `เกณฑ์ LTV ผ่อนปรน — กู้ได้สูงสุด 100% ถึง ${LTV_RELAXATION_END_LABEL}`
              : ltvPolicyName === "normal"
                ? "เกณฑ์ LTV ปกติ — ตามจำนวนบ้านและราคาบ้าน"
                : "ยังไม่ทราบเกณฑ์ LTV — กรอกข้อมูลด้านบนเพื่อดูผลประเมิน"}
          </div>
          <InfoTooltip label="LTV (Loan-to-Value) คือสัดส่วนเงินกู้ต่อราคาบ้าน ยิ่งสูง ยิ่งต้องใช้เงินดาวน์น้อย เช่น LTV 90% หมายถึงกู้ได้ 90% ของราคาบ้าน ต้องมีเงินดาวน์อย่างน้อย 10%" />
        </div>
      </div>
    </section>
  );
}
