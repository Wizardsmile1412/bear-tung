import { MonthFinancials, Ratio, RatioResult, statusFromScore } from "./Ratio";

/**
 * Emergency Fund = savings / (expense + debt), expressed in months of
 * "burn" the household could survive on current savings alone. When there
 * is no monthly burn at all, runway is effectively unlimited (Infinity),
 * which is a legitimate value (not a bug) — the UI formats it separately.
 */
export class EmergencyFundRatio implements Ratio {
  calculate(m: MonthFinancials): RatioResult {
    const burn = m.expense + m.debt;
    const value = burn > 0 ? m.savings / burn : Infinity;
    const score = burn > 0 ? this.toScore(value) : 100;
    return {
      key: "emergencyFund",
      label: "เงินสำรองฉุกเฉิน (Emergency Fund)",
      value,
      score,
      status: statusFromScore(score),
    };
  }

  private toScore(v: number): number {
    if (v >= 6) return 100;
    if (v >= 3) return 60 + ((v - 3) / 3) * 40; // 3 -> 60, 6 -> 100
    if (v >= 1) return 30 + ((v - 1) / 2) * 30; // 1 -> 30, 3 -> 60
    return Math.max(0, (v / 1) * 30); // 0 -> 0, 1 -> 30; guards negative v defensively
  }
}
