"use client";

import { Money } from "@/domain/model/Money";
import { CoBorrowerResult } from "@/domain/mortgage/CoBorrowerService";

import { StatusBadge } from "@/components/health/StatusBadge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { NumericField } from "@/components/ui/NumericField";

interface CoBorrowerSectionProps {
  enabled: boolean;
  onEnabledChange(value: boolean): void;
  coDebt: number;
  onCoDebtChange(value: number): void;
  coIncomeProvided: number | undefined;
  onCoIncomeProvidedChange(value: number | undefined): void;
  result: CoBorrowerResult | null;
}

/**
 * "ต้องการเพิ่มผู้กู้ร่วม" toggle + co-borrower inputs + the resulting
 * minimum-required-income (or LTV-blocked / already-qualifies) message,
 * per spec 8.5.
 */
export function CoBorrowerSection({
  enabled,
  onEnabledChange,
  coDebt,
  onCoDebtChange,
  coIncomeProvided,
  onCoIncomeProvidedChange,
  result,
}: CoBorrowerSectionProps) {
  return (
    <section className="rounded-card border border-outline bg-surface p-6 shadow-card">
      <div className="flex items-center gap-2">
        <input
          id="coBorrowerEnabled"
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
          className="h-5 w-5 rounded-sm border border-outline accent-primary"
        />
        <label htmlFor="coBorrowerEnabled" className="text-xl font-semibold text-ink">
          ต้องการเพิ่มผู้กู้ร่วม
        </label>
        <InfoTooltip label="ผู้กู้ร่วมคือการนำรายได้และหนี้ของอีกคนมารวมกับของคุณ ธนาคารจะคำนวณ DSR จากรายได้และหนี้รวมกันทั้งสองคน ช่วยให้กู้ได้วงเงินสูงขึ้นได้ในกรณีที่ติดเงื่อนไข DSR (แต่ไม่ช่วยหากติดเงื่อนไข LTV จากเงินดาวน์ไม่พอ)" />
      </div>

      {enabled && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="coDebt" className="text-sm font-medium text-ink-muted">
              หนี้ปัจจุบันของผู้กู้ร่วม
            </label>
            <div className="flex items-center gap-2">
              <NumericField
                id="coDebt"
                inputMode="decimal"
                value={coDebt}
                onChange={onCoDebtChange}
                thousandsSeparator
                className="w-full rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
              />
              <span className="text-xs text-ink-subtle whitespace-nowrap">บาท</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="coIncomeProvided" className="text-sm font-medium text-ink-muted">
              รายได้ของผู้กู้ร่วม (ถ้ามี)
            </label>
            <div className="flex items-center gap-2">
              <NumericField
                id="coIncomeProvided"
                inputMode="decimal"
                value={coIncomeProvided}
                onChange={onCoIncomeProvidedChange}
                optional
                thousandsSeparator
                className="w-full rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
              />
              <span className="text-xs text-ink-subtle whitespace-nowrap">บาท</span>
            </div>
          </div>

          {result && (
            <div className="flex flex-col gap-2">
              {result.isLtvBound ? (
                <StatusBadge
                  tone="warning"
                  label="ผู้กู้ร่วมไม่สามารถช่วยได้ในกรณีนี้ เนื่องจากเงินดาวน์ไม่เพียงพอตามเกณฑ์ LTV ลองเพิ่มเงินดาวน์ หรือเลือกบ้านราคาที่ต่ำลง"
                />
              ) : result.alreadyQualifies ? (
                <StatusBadge tone="good" label="คุณมีคุณสมบัติเพียงพอแล้ว ไม่จำเป็นต้องมีผู้กู้ร่วม" />
              ) : (
                <p className="text-base text-ink">
                  ผู้กู้ร่วมควรมีรายได้อย่างน้อย {Money.formatWithUnit(result.requiredCoIncome)}/เดือน เพื่อให้กู้ผ่าน (DSR 40%)
                </p>
              )}

              {result.combinedIncomeSufficient !== undefined && (
                <StatusBadge
                  tone={result.combinedIncomeSufficient ? "good" : "warning"}
                  label={result.combinedIncomeSufficient ? "รายได้รวมของคุณและผู้กู้ร่วมเพียงพอแล้ว" : "รายได้รวมยังไม่เพียงพอ"}
                />
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
