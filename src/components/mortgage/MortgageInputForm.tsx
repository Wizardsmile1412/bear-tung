"use client";

import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { NumericField } from "@/components/ui/NumericField";

const DOWN_PAYMENT_TOOLTIP =
  "แม้เกณฑ์ LTV จะให้กู้ได้เต็ม 100% (ดาวน์ 0%) แต่การมีเงินดาวน์สัก 5–10% มักคุ้มที่สุด " +
  "\nเพราะช่วยลดวงเงินกู้ ทำให้ดอกเบี้ยรวมและค่างวดต่อเดือนน้อยลง และยังเหลือเงินไว้สำหรับค่าใช้จ่ายวันโอน " +
  "เช่น ค่าธรรมเนียมการโอน ค่าจดจำนอง และค่าส่วนกลางล่วงหน้า \nระบบจึงตั้งค่าเริ่มต้นเงินดาวน์ไว้ที่ 5% ของราคาบ้าน (ปรับได้)";

interface MortgageInputFormProps {
  homePrice: number;
  onHomePriceChange(value: number): void;
  homeOrder: 1 | 2 | 3;
  onHomeOrderChange(value: 1 | 2 | 3): void;
  firstHomePaidAtLeastTwoYears: boolean;
  onFirstHomePaidAtLeastTwoYearsChange(value: boolean): void;
  /**
   * Whether the "first home paid >= 2 years" question affects the result —
   * only under the normal (post-relaxation) LTV rules. During the temporary
   * 100% relaxation it has no effect, so the question is hidden.
   */
  firstHomePaidQuestionApplies: boolean;
  borrowerAge: number;
  onBorrowerAgeChange(value: number): void;
  downPaymentAvailable: number;
  onDownPaymentAvailableChange(value: number): void;
  /** Which quick-select % is active (null = a manual or auto value). */
  selectedDownPaymentPercent: 5 | 10 | null;
  onSelectDownPaymentPercent(percent: 5 | 10): void;
}

/** Quick-select down-payment percentages (of the home price). */
const DOWN_PAYMENT_PERCENT_OPTIONS = [5, 10] as const;

/**
 * Controlled inputs for the home/borrower facts needed by `MortgageService`.
 * `monthlyIncome`/`existingDebt` are NOT collected here — per spec 8.1 they
 * are auto-derived from the cash-flow profile at the selected assessment
 * month (see the mortgage page), not manually entered.
 */
export function MortgageInputForm({
  homePrice,
  onHomePriceChange,
  homeOrder,
  onHomeOrderChange,
  firstHomePaidAtLeastTwoYears,
  onFirstHomePaidAtLeastTwoYearsChange,
  firstHomePaidQuestionApplies,
  borrowerAge,
  onBorrowerAgeChange,
  downPaymentAvailable,
  onDownPaymentAvailableChange,
  selectedDownPaymentPercent,
  onSelectDownPaymentPercent,
}: MortgageInputFormProps) {
  return (
    <section className="rounded-card border border-outline bg-surface p-6 shadow-card">
      <h2 className="text-xl font-semibold text-ink">ข้อมูลบ้านและผู้กู้ (หลัก)</h2>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="homePrice" className="text-sm font-medium text-ink-muted">
            ราคาบ้านที่ต้องการ
          </label>
          <div className="flex items-center gap-2">
            <NumericField
              id="homePrice"
              inputMode="decimal"
              value={homePrice}
              onChange={onHomePriceChange}
              thousandsSeparator
              className="w-full rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
            />
            <span className="text-xs text-ink-subtle whitespace-nowrap">บาท</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="homeOrder" className="text-sm font-medium text-ink-muted">
            บ้านหลังนี้เป็นหลังที่
          </label>
          <select
            id="homeOrder"
            value={homeOrder}
            onChange={(event) => onHomeOrderChange(Number(event.target.value) as 1 | 2 | 3)}
            className="rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
          >
            <option value={1}>บ้านหลังที่ 1</option>
            <option value={2}>บ้านหลังที่ 2</option>
            <option value={3}>บ้านหลังที่ 3 หรือมากกว่า</option>
          </select>
        </div>

        {homeOrder === 2 && firstHomePaidQuestionApplies && (
          <div className="flex items-center gap-2">
            <input
              id="firstHomePaidAtLeastTwoYears"
              type="checkbox"
              checked={firstHomePaidAtLeastTwoYears}
              onChange={(event) => onFirstHomePaidAtLeastTwoYearsChange(event.target.checked)}
              className="h-5 w-5 rounded-sm border border-outline accent-primary"
            />
            <label htmlFor="firstHomePaidAtLeastTwoYears" className="text-sm font-medium text-ink-muted">
              ผ่อนบ้านหลังแรกมาแล้วอย่างน้อย 2 ปี
            </label>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="borrowerAge" className="text-sm font-medium text-ink-muted">
            อายุผู้กู้
          </label>
          <NumericField
            id="borrowerAge"
            inputMode="numeric"
            value={borrowerAge}
            onChange={onBorrowerAgeChange}
            className="rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <label htmlFor="downPaymentAvailable" className="text-sm font-medium text-ink-muted">
              เงินดาวน์ที่มี
            </label>
            <InfoTooltip label={DOWN_PAYMENT_TOOLTIP} />
          </div>
          <div className="flex items-center gap-2">
            <NumericField
              id="downPaymentAvailable"
              inputMode="decimal"
              value={downPaymentAvailable}
              onChange={onDownPaymentAvailableChange}
              thousandsSeparator
              className="w-full rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
            />
            <span className="text-xs text-ink-subtle whitespace-nowrap">บาท</span>
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-ink-subtle">เลือกเร็ว:</span>
            {DOWN_PAYMENT_PERCENT_OPTIONS.map((percent) => {
              const isActive = selectedDownPaymentPercent === percent;
              return (
                <button
                  key={percent}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onSelectDownPaymentPercent(percent)}
                  className={`inline-flex h-8 items-center gap-1 rounded-pill border px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-outline bg-surface text-ink-muted hover:bg-surface-sunken"
                  }`}
                >
                  {isActive && <span aria-hidden="true">✓</span>}
                  {percent}%
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
