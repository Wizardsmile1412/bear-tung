import { MonthFinancials, Ratio, RatioResult, statusFromScore } from "./Ratio";

/**
 * Savings Rate = (income - expense - debt) / income, i.e. remainingCashFlow
 * as a fraction of income. Guards divide-by-zero when income is 0.
 */
export class SavingsRateRatio implements Ratio {
  calculate(m: MonthFinancials): RatioResult {
    const value = m.income > 0 ? (m.income - m.expense - m.debt) / m.income : 0;
    const score = this.toScore(value);
    return {
      key: "savingsRate",
      label: "อัตราการออม (Savings Rate)",
      value,
      score,
      status: statusFromScore(score),
    };
  }

  private toScore(v: number): number {
    // Per spec 6.1: 0-10% -> 30-59 (linear), 10-20% -> 60-99 (linear), >=20% -> 100.
    // Continuous through every boundary (matches DsrRatio/EmergencyFundRatio):
    // v=0 -> 30, v=0.10 -> 60, v=0.20 -> 100. Negative rates ramp the same
    // linear slope below 0 down to a floor of 0 at v=-0.1 (overspending).
    if (v >= 0.2) return 100;
    if (v >= 0.1) return 60 + ((v - 0.1) / 0.1) * 40;
    if (v >= -0.1) return 30 + (v / 0.1) * 30;
    return 0;
  }
}
