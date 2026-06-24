import { PROJECTION_MONTHS } from "../config/defaults";
import { CashFlowProfile } from "../model/CashFlowProfile";
import { MonthKey } from "../model/MonthKey";
import { MonthFinancials, RatioResult } from "../ratios/Ratio";
import { HealthScoreService } from "../scoring/HealthScoreService";

export interface MonthlyProjectionEntry {
  month: string; // 'YYYY-MM'
  totalIncome: number;
  totalExpense: number;
  totalDebt: number;
  remainingCashFlow: number;
  savings: number; // running balance AT the start of this month (before this month's remainingCashFlow is added)
  score: number;
  light: "green" | "yellow" | "red";
  ratioResults: RatioResult[];
}

/**
 * Builds the 60-month projection series (spec 7.1), combining cash-flow
 * totals (from `CashFlowProfile.monthlyTotals`) with the per-month health
 * score (from the injected `HealthScoreService` — DIP).
 *
 * `savings` is modeled as a running balance: it starts at
 * `profile.assets.savings` for month 0, and carries forward by adding each
 * month's `remainingCashFlow` as we move to the next month (i.e. assumes
 * the household keeps whatever's left over). This is what makes the trend
 * meaningful over the 5-year window.
 */
export class ProjectionService {
  constructor(private readonly healthScoreService: HealthScoreService) {}

  buildSeries(profile: CashFlowProfile): MonthlyProjectionEntry[] {
    const start = MonthKey.parse(profile.startMonth);
    let runningSavings = profile.assets.savings;
    const entries: MonthlyProjectionEntry[] = [];

    for (let i = 0; i < PROJECTION_MONTHS; i++) {
      const month = start.shift(i);
      const totals = profile.monthlyTotals(month);
      const financials: MonthFinancials = {
        income: totals.totalIncome,
        expense: totals.totalExpense,
        debt: totals.totalDebt,
        savings: runningSavings,
      };
      const { score, light, results } = this.healthScoreService.evaluate(financials);

      entries.push({
        month: month.toString(),
        ...totals,
        savings: runningSavings,
        score,
        light,
        ratioResults: results,
      });

      runningSavings += totals.remainingCashFlow;
    }

    return entries;
  }
}
