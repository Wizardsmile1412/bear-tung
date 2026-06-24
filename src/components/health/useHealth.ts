"use client";

import { useMemo } from "react";

import { MonthlyTotals } from "@/domain/model/CashFlowProfile";
import { MonthFinancials, RatioResult } from "@/domain/ratios/Ratio";
import { createHealthScoreService } from "@/domain/scoring/createHealthScoreService";

import { useProfile } from "@/components/profile/useProfile";

// Stateless pure service — safe to create once at module scope rather than
// per-render or per-component-instance.
const healthScoreService = createHealthScoreService();

export interface UseHealthResult {
  isLoaded: boolean;
  month: string;
  totals: MonthlyTotals;
  score: number;
  light: "green" | "yellow" | "red";
  results: RatioResult[];
}

/**
 * Evaluates the health score + ratio results for one month of the current
 * profile. Defaults to `profile.startMonth` when no month is given; accepts
 * an explicit month so a future phase can wire up a month slider without
 * changing this hook's shape.
 *
 * Uses the snapshot `assets.savings` directly (no running-balance
 * accumulation across months yet) — that is a projection-only concern for a
 * later phase.
 */
export function useHealth(month?: string): UseHealthResult {
  const { profile, isLoaded } = useProfile();
  const targetMonth = month ?? profile.startMonth;

  const totals = useMemo(() => profile.monthlyTotals(targetMonth), [profile, targetMonth]);

  const financials: MonthFinancials = useMemo(
    () => ({
      income: totals.totalIncome,
      expense: totals.totalExpense,
      debt: totals.totalDebt,
      savings: profile.assets.savings,
    }),
    [totals, profile],
  );

  const evaluation = useMemo(() => healthScoreService.evaluate(financials), [financials]);

  return {
    isLoaded,
    month: targetMonth,
    totals,
    score: evaluation.score,
    light: evaluation.light,
    results: evaluation.results,
  };
}
