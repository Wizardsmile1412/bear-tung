"use client";

interface MortgageInputFormProps {
  homePrice: number;
  onHomePriceChange(value: number): void;
  homeOrder: 1 | 2 | 3;
  onHomeOrderChange(value: 1 | 2 | 3): void;
  firstHomePaidAtLeastTwoYears: boolean;
  onFirstHomePaidAtLeastTwoYearsChange(value: boolean): void;
  borrowerAge: number;
  onBorrowerAgeChange(value: number): void;
  downPaymentAvailable: number;
  onDownPaymentAvailableChange(value: number): void;
}

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
  borrowerAge,
  onBorrowerAgeChange,
  downPaymentAvailable,
  onDownPaymentAvailableChange,
}: MortgageInputFormProps) {
  return (
    <section className="rounded-card border border-outline bg-surface p-6 shadow-card">
      <h2 className="text-xl font-semibold text-ink">ข้อมูลบ้านและผู้กู้</h2>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="homePrice" className="text-sm font-medium text-ink-muted">
            ราคาบ้านที่ต้องการ
          </label>
          <div className="flex items-center gap-2">
            <input
              id="homePrice"
              type="number"
              inputMode="decimal"
              min={0}
              step="1"
              value={homePrice}
              onChange={(event) => {
                const value = Number(event.target.value);
                onHomePriceChange(Number.isFinite(value) && value >= 0 ? value : 0);
              }}
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

        {homeOrder === 2 && (
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
          <input
            id="borrowerAge"
            type="number"
            inputMode="numeric"
            min={0}
            step="1"
            value={borrowerAge}
            onChange={(event) => {
              const value = Number(event.target.value);
              onBorrowerAgeChange(Number.isFinite(value) && value >= 0 ? value : 0);
            }}
            className="rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="downPaymentAvailable" className="text-sm font-medium text-ink-muted">
            เงินดาวน์ที่มี
          </label>
          <div className="flex items-center gap-2">
            <input
              id="downPaymentAvailable"
              type="number"
              inputMode="decimal"
              min={0}
              step="1"
              value={downPaymentAvailable}
              onChange={(event) => {
                const value = Number(event.target.value);
                onDownPaymentAvailableChange(Number.isFinite(value) && value >= 0 ? value : 0);
              }}
              className="w-full rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
            />
            <span className="text-xs text-ink-subtle whitespace-nowrap">บาท</span>
          </div>
        </div>
      </div>
    </section>
  );
}
