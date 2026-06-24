/** Per-month financial inputs shared by every ratio. */
export interface MonthFinancials {
  income: number;
  expense: number; // excludes debt
  debt: number; // monthly debt service
  savings: number; // cumulative savings balance at this point in time
}

/** Result of evaluating one ratio for a given month. */
export interface RatioResult {
  key: string; // 'savingsRate' | 'dsr' | 'emergencyFund'
  label: string; // Thai + English jargon, e.g. 'DSR (สัดส่วนภาระหนี้ต่อรายได้)'
  value: number; // actual ratio value (e.g. 0.18, or months for emergency fund)
  score: number; // 0-100
  status: "good" | "warning" | "danger";
}

/**
 * Strategy interface for a single financial-health ratio (Savings Rate, DSR,
 * Emergency Fund, ...). Implementations are interchangeable (LSP) and new
 * ratios can be added without touching `HealthScoreService` (OCP).
 */
export interface Ratio {
  calculate(m: MonthFinancials): RatioResult;
}

/** Shared status-band thresholds, consistent with the traffic-light bands. */
export function statusFromScore(score: number): RatioResult["status"] {
  return score >= 80 ? "good" : score >= 50 ? "warning" : "danger";
}
