import { MonthFinancials, Ratio, RatioResult, statusFromScore } from "./Ratio";

/**
 * DSR (Debt Service Ratio) = monthly debt / income. When income is 0 and
 * there is any debt, treated as the worst case (value = 1, i.e. 100% DSR).
 */
export class DsrRatio implements Ratio {
  calculate(m: MonthFinancials): RatioResult {
    const value = m.income > 0 ? m.debt / m.income : 1;
    const score = this.toScore(value);
    return {
      key: "dsr",
      label: "DSR (สัดส่วนภาระหนี้ต่อรายได้)",
      value,
      score,
      status: statusFromScore(score),
    };
  }

  private toScore(v: number): number {
    if (v <= 0.3) return 100;
    if (v <= 0.4) return 70 + ((0.4 - v) / 0.1) * 30;
    if (v <= 0.6) return 30 + ((0.6 - v) / 0.2) * 40;
    return Math.max(0, 30 * (1 - (v - 0.6) / 0.4));
  }
}
