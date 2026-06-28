import { Money } from "@/domain/model/Money";
import { MortgageResult } from "@/domain/mortgage/MortgageService";

import { StatusBadge } from "@/components/health/StatusBadge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

interface MortgageResultCardProps {
  result: MortgageResult;
  downPaymentAvailable: number;
}

/**
 * Mortgage Result Card (design.md section 6): affordable/not, max home
 * price, monthly payment + DSR after loan, required vs. available down
 * payment, binding constraint, and the mandatory educational disclaimer.
 */
export function MortgageResultCard({ result, downPaymentAvailable }: MortgageResultCardProps) {
  const dsrAfterLoanPercent = Math.round(result.dsrAfterLoan * 100);
  const downPaymentSufficient = downPaymentAvailable >= result.requiredDownPayment;

  return (
    <section className="rounded-card border border-outline bg-surface p-6 shadow-card">
      <h2 className="text-xl font-semibold text-ink">ผลการประเมินสินเชื่อ</h2>

      <div className="mt-4 flex flex-col gap-4">
        {result.canAffordTarget ? (
          <StatusBadge tone="good" label="สามารถซื้อบ้านราคานี้ได้" />
        ) : (
          <StatusBadge tone="danger" label="ยังไม่สามารถซื้อบ้านราคานี้ได้ในตอนนี้" />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-ink-muted">ราคาบ้านสูงสุดที่กู้ได้</p>
            <p className="text-lg font-semibold text-ink">{Money.formatWithUnit(result.affordableHomePrice)}</p>
          </div>

          <div>
            <p className="text-sm text-ink-muted">ค่างวดต่อเดือน (ประมาณ)</p>
            <p className="text-lg font-semibold text-ink">{Money.formatWithUnit(result.monthlyPayment)}</p>
            <p className="text-sm text-ink-subtle">DSR หลังกู้ {dsrAfterLoanPercent}%</p>
          </div>

          <div>
            <p className="text-sm text-ink-muted">เงินดาวน์ที่ต้องใช้</p>
            <p className="text-lg font-semibold text-ink">{Money.formatWithUnit(result.requiredDownPayment)}</p>
            <p className="text-sm text-ink-subtle">เงินดาวน์ที่มี: {Money.formatWithUnit(downPaymentAvailable)}</p>
            {downPaymentSufficient ? (
              <StatusBadge tone="good" label="เงินดาวน์เพียงพอ" />
            ) : (
              <StatusBadge tone="danger" label="เงินดาวน์ไม่พอ" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm text-ink-muted">ติดเงื่อนไข</p>
              <InfoTooltip label="ธนาคารตรวจสอบ 2 เงื่อนไขหลัก: LTV (สัดส่วนเงินกู้ต่อราคาบ้าน — มีผลต่อเงินดาวน์ที่ต้องใช้) และ DSR (สัดส่วนภาระหนี้ต่อรายได้ — มีผลต่อค่างวดที่ผ่อนได้ไหว) ตัวที่ทำให้กู้ได้น้อยกว่าจะเป็นตัว 'ติดเงื่อนไข' ที่จำกัดวงเงินกู้สูงสุดของคุณ" />
            </div>
            <p className="text-lg font-semibold text-ink">
              {result.bindingConstraint === "ltv" ? "ติดเงื่อนไข: เงินดาวน์ (LTV)" : "ติดเงื่อนไข: ภาระหนี้ต่อรายได้ (DSR)"}
            </p>
          </div>
        </div>

        <p className="text-sm text-ink-subtle">เป็นการประมาณการเพื่อการศึกษา ไม่ใช่การอนุมัติจากธนาคาร</p>
      </div>
    </section>
  );
}
