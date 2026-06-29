"use client";

import { LTV_RELAXATION_END_DATE } from "@/domain/config/defaults";

import { formatMonthLabel } from "@/components/health/formatMonthLabel";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { NumericField } from "@/components/ui/NumericField";

// Derived from the same `LTV_RELAXATION_END_DATE` ('2027-06-30') the domain's
// `LtvPolicyFactory` uses to pick the policy, so the badge text can never
// drift from the actual rule boundary — e.g. '30 มิ.ย. 2027'.
const [endYear, endMonth, endDay] = LTV_RELAXATION_END_DATE.split("-");
const LTV_RELAXATION_END_LABEL = `${Number(endDay)} ${formatMonthLabel(`${endYear}-${endMonth}`)}`;

interface AssumptionPanelProps {
  interestRatePercent: number;
  onInterestRatePercentChange(value: number): void;
  loanTermYears: number;
  onLoanTermYearsChange(value: number): void;
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
  /** True when borrowerAge + loanTermYears has hit the 70-year bank cap, capping loanTermYears down. */
  isAgeTermCapped: boolean;
}

/**
 * Controlled inputs for the mortgage assumptions the user can adjust
 * (interest rate / term), a fixed (non-adjustable) DSR cap, and a read-only
 * badge showing which LTV rule set is currently active (driven by
 * `MortgageService`'s result).
 */
export function AssumptionPanel({
  interestRatePercent,
  onInterestRatePercentChange,
  loanTermYears,
  onLoanTermYearsChange,
  dsrLimitPercent,
  onDsrLimitPercentChange,
  ltvPolicyName,
  isAgeTermCapped,
}: AssumptionPanelProps) {
  return (
    <section className="rounded-card border border-outline bg-surface p-6 shadow-card">
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
            <NumericField
              id="interestRatePercent"
              inputMode="decimal"
              allowDecimal
              value={interestRatePercent}
              onChange={onInterestRatePercentChange}
              className="w-full rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
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
            <NumericField
              id="loanTermYears"
              inputMode="numeric"
              value={loanTermYears}
              onChange={onLoanTermYearsChange}
              className="w-full rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
            />
            <span className="text-xs text-ink-subtle whitespace-nowrap">ปี</span>
          </div>
          {isAgeTermCapped && (
            <p className="text-xs font-medium text-danger">อายุผู้กู้ (หลัก) รวม ระยะเวลากู้ ต้องไม่เกิน 70 ปี</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <label htmlFor="dsrLimitPercent" className="text-sm font-medium text-ink-muted">
              DSR สูงสุดที่รับได้
            </label>
            <InfoTooltip label={`DSR (Debt Service Ratio) คือสัดส่วนภาระหนี้ต่อรายได้ต่อเดือน\n\nธนาคารไทยส่วนใหญ่ใช้เกณฑ์ 40% เป็นมาตรฐาน หมายความว่าค่างวดบ้านรวมกับหนี้อื่น ๆ ต้องไม่เกิน 40% ของรายได้\n\nบางธนาคารอาจยืดหยุ่นได้ถึง 50% ในกรณีพิเศษ เช่น รายได้สูงหรือประวัติเครดิตดี`} />
          </div>
          <div className="flex items-center gap-2">
            <NumericField
              id="dsrLimitPercent"
              inputMode="decimal"
              allowDecimal
              value={dsrLimitPercent}
              onChange={onDsrLimitPercentChange}
              className="w-full rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
            />
            <span className="text-xs text-ink-subtle whitespace-nowrap">%</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="rounded-pill bg-primary-soft px-4 py-2 text-sm font-medium text-primary">
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
