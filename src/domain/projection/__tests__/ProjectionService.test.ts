import { describe, expect, it } from "vitest";

import { PROJECTION_MONTHS } from "../../config/defaults";
import { CashFlowProfile } from "../../model/CashFlowProfile";
import { LineItem } from "../../model/LineItem";
import { createHealthScoreService } from "../../scoring/createHealthScoreService";
import { ProjectionService } from "../ProjectionService";

function makeIncomeWithRaise(): LineItem {
  return LineItem.create({
    id: "salary",
    category: "income",
    subCategory: "salary",
    label: "Salary",
    changes: [
      { effectiveFrom: "2026-06", amount: 35000 },
      { effectiveFrom: "2027-01", amount: 45000 },
    ],
  });
}

function makeCarLoan(): LineItem {
  return LineItem.create({
    id: "carLoan",
    category: "debt",
    subCategory: "carLoan",
    label: "Car loan",
    changes: [{ effectiveFrom: "2026-06", amount: 10000 }],
    endMonth: "2026-09", // active Jun-Sep 2026 (4 months), gone from Oct 2026
  });
}

describe("ProjectionService", () => {
  const projectionService = new ProjectionService(createHealthScoreService());

  it(`builds a series of exactly PROJECTION_MONTHS (${PROJECTION_MONTHS}) months`, () => {
    const profile = CashFlowProfile.empty("2026-06").addItem(makeIncomeWithRaise());
    const series = projectionService.buildSeries(profile);

    expect(series).toHaveLength(PROJECTION_MONTHS);
    expect(series[0].month).toBe("2026-06");
    expect(series[PROJECTION_MONTHS - 1].month).toBe("2031-05");
  });

  it("applies carry-forward: income stays 35000 through 2026-12, then 45000 from 2027-01", () => {
    const profile = CashFlowProfile.empty("2026-06").addItem(makeIncomeWithRaise());
    const series = projectionService.buildSeries(profile);

    const jun2026 = series.find((e) => e.month === "2026-06")!; // well before the raise
    const dec2026 = series.find((e) => e.month === "2026-12")!; // last month at the old amount
    const jan2027 = series.find((e) => e.month === "2027-01")!; // first month at the new amount

    expect(jun2026.totalIncome).toBe(35000);
    expect(dec2026.totalIncome).toBe(35000);
    expect(jan2027.totalIncome).toBe(45000);
  });

  it("debt with an endMonth drops out of totalDebt after it ends, typically improving the score", () => {
    const profile = CashFlowProfile.empty("2026-06")
      .addItem(makeIncomeWithRaise())
      .addItem(makeCarLoan())
      .addItem(
        LineItem.create({
          id: "rent",
          category: "expense",
          subCategory: "rent",
          label: "Rent",
          changes: [{ effectiveFrom: "2026-06", amount: 10000 }],
        }),
      );

    const series = projectionService.buildSeries(profile);

    const sep2026 = series.find((e) => e.month === "2026-09")!; // last month the loan is active
    const oct2026 = series.find((e) => e.month === "2026-10")!; // loan has ended

    expect(sep2026.totalDebt).toBe(10000);
    expect(oct2026.totalDebt).toBe(0);
    expect(oct2026.remainingCashFlow).toBeGreaterThan(sep2026.remainingCashFlow);
    expect(oct2026.score).toBeGreaterThanOrEqual(sep2026.score);
  });

  it("running savings balance accumulates remainingCashFlow month over month", () => {
    const profile = CashFlowProfile.empty("2026-06")
      .addItem(
        LineItem.create({
          id: "salary",
          category: "income",
          subCategory: "salary",
          label: "Salary",
          changes: [{ effectiveFrom: "2026-06", amount: 30000 }],
        }),
      )
      .addItem(
        LineItem.create({
          id: "expense",
          category: "expense",
          subCategory: "food",
          label: "Food",
          changes: [{ effectiveFrom: "2026-06", amount: 20000 }],
        }),
      )
      .updateAssets({ savings: 100000 });

    const series = projectionService.buildSeries(profile);

    // remainingCashFlow = 30000 - 20000 = 10000 every month.
    expect(series[0].savings).toBe(100000); // starting balance, before month 0's remainder is added
    expect(series[1].savings).toBe(110000); // + 1 month of remainder
    expect(series[2].savings).toBe(120000); // + 2 months of remainder
    expect(series[3].savings).toBe(130000); // + 3 months of remainder

    // Explicitly assert the recurrence savings[i+1] = savings[i] + remainingCashFlow[i]
    // for 3 consecutive transitions, not just spot-checked absolute values.
    for (let i = 0; i < 3; i++) {
      expect(series[i + 1].savings).toBe(series[i].savings + series[i].remainingCashFlow);
    }
  });

  it("ratioResults contains all 3 ratios for each entry", () => {
    const profile = CashFlowProfile.empty("2026-06").addItem(makeIncomeWithRaise());
    const series = projectionService.buildSeries(profile);

    expect(series[0].ratioResults.map((r) => r.key)).toEqual(["savingsRate", "dsr", "emergencyFund"]);
  });
});
