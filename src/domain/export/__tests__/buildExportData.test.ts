import { describe, expect, it } from "vitest";

import { CashFlowProfile } from "../../model/CashFlowProfile";
import { LineItem } from "../../model/LineItem";
import { MonthlyProjectionEntry } from "../../projection/ProjectionService";
import { RatioResult } from "../../ratios/Ratio";
import { buildExportData, CashFlowRowInput } from "../buildExportData";
import { MortgageExportData } from "../ExportData";

function buildProfile(): CashFlowProfile {
  return CashFlowProfile.empty("2026-06")
    .addItem(
      LineItem.create({
        id: "income-1",
        category: "income",
        subCategory: "salary",
        label: "เงินเดือน",
        changes: [{ effectiveFrom: "2026-06", amount: 50000 }],
      }),
    )
    .updateAssets({ savings: 120000 });
}

function buildRatioResults(overrides: Partial<Record<string, Partial<RatioResult>>> = {}): RatioResult[] {
  const base: Record<string, RatioResult> = {
    savingsRate: { key: "savingsRate", label: "Savings Rate", value: 0.25, score: 100, status: "good" },
    dsr: { key: "dsr", label: "DSR", value: 0.2, score: 100, status: "good" },
    emergencyFund: { key: "emergencyFund", label: "Emergency Fund", value: 4.5, score: 80, status: "good" },
  };
  for (const [key, override] of Object.entries(overrides)) {
    base[key] = { ...base[key], ...override };
  }
  return Object.values(base);
}

function buildProjection(): MonthlyProjectionEntry[] {
  const entries: MonthlyProjectionEntry[] = [];
  for (let i = 0; i < 3; i++) {
    entries.push({
      month: `2026-0${6 + i}`,
      totalIncome: 50000,
      totalExpense: 20000,
      totalDebt: 5000,
      remainingCashFlow: 25000,
      savings: 120000 + i * 25000,
      score: 80 + i,
      light: "green",
      ratioResults: buildRatioResults(),
    });
  }
  return entries;
}

const cashFlowRows: CashFlowRowInput[] = [
  { category: "รายรับ", subCategory: "เงินเดือน", label: "เงินเดือน", amountPerMonth: 50000 },
];

describe("buildExportData", () => {
  it("maps cash flow rows, totals, and savings correctly", () => {
    const profile = buildProfile();
    const data = buildExportData({
      profile,
      cashFlowRows,
      health: {
        month: "2026-06",
        totals: { totalIncome: 50000, totalExpense: 20000, totalDebt: 5000, remainingCashFlow: 25000 },
        score: 85,
        light: "green",
        results: buildRatioResults(),
      },
      projection: buildProjection(),
    });

    expect(data.month).toBe("2026-06");
    expect(data.cashFlow.rows).toEqual(cashFlowRows);
    expect(data.cashFlow.savings).toBe(120000);
    expect(data.cashFlow.totalIncome).toBe(50000);
    expect(data.cashFlow.totalExpense).toBe(20000);
    expect(data.cashFlow.totalDebt).toBe(5000);
    expect(data.cashFlow.remainingCashFlow).toBe(25000);
  });

  it("maps health rows with score/light and formats normal (finite) ratio values", () => {
    const profile = buildProfile();
    const data = buildExportData({
      profile,
      cashFlowRows,
      health: {
        month: "2026-06",
        totals: { totalIncome: 50000, totalExpense: 20000, totalDebt: 5000, remainingCashFlow: 25000 },
        score: 85,
        light: "green",
        results: buildRatioResults(),
      },
      projection: buildProjection(),
    });

    expect(data.health.score).toBe(85);
    expect(data.health.light).toBe("green");
    expect(data.health.rows).toHaveLength(3);

    const savingsRow = data.health.rows.find((row) => row.key === "savingsRate")!;
    expect(savingsRow.value).toBe(0.25);
    expect(savingsRow.valueDisplay).toBe("25%");
    expect(savingsRow.thresholdDescription).toBe("ควรมากกว่า 20% ของรายรับ");

    const dsrRow = data.health.rows.find((row) => row.key === "dsr")!;
    expect(dsrRow.valueDisplay).toBe("20%");
    expect(dsrRow.thresholdDescription).toBe("ควรไม่เกิน 40% ของรายรับ");

    const efRow = data.health.rows.find((row) => row.key === "emergencyFund")!;
    expect(efRow.value).toBe(4.5);
    expect(efRow.valueDisplay).toBe("4.5 เดือน");
    expect(efRow.thresholdDescription).toBe("ควรมีอย่างน้อย 3-6 เดือน");
  });

  it("never leaks a raw Infinity/NaN into the emergency-fund row's numeric value", () => {
    const profile = buildProfile();
    const results = buildRatioResults({ emergencyFund: { value: Infinity, score: 100 } });

    const data = buildExportData({
      profile,
      cashFlowRows,
      health: {
        month: "2026-06",
        totals: { totalIncome: 50000, totalExpense: 0, totalDebt: 0, remainingCashFlow: 50000 },
        score: 90,
        light: "green",
        results,
      },
      projection: buildProjection(),
    });

    const efRow = data.health.rows.find((row) => row.key === "emergencyFund")!;
    expect(efRow.value).toBe(0);
    expect(Number.isFinite(efRow.value)).toBe(true);
    expect(efRow.valueDisplay).toBe("ไม่จำกัด");

    // Guard the general invariant across every row, not just emergencyFund.
    for (const row of data.health.rows) {
      expect(Number.isFinite(row.value)).toBe(true);
      expect(Number.isNaN(row.value)).toBe(false);
    }
  });

  it("maps every projection entry 1:1", () => {
    const profile = buildProfile();
    const projection = buildProjection();

    const data = buildExportData({
      profile,
      cashFlowRows,
      health: {
        month: "2026-06",
        totals: { totalIncome: 50000, totalExpense: 20000, totalDebt: 5000, remainingCashFlow: 25000 },
        score: 85,
        light: "green",
        results: buildRatioResults(),
      },
      projection,
    });

    expect(data.projection).toHaveLength(3);
    expect(data.projection[0]).toEqual({
      month: "2026-06",
      totalIncome: 50000,
      totalExpense: 20000,
      totalDebt: 5000,
      remainingCashFlow: 25000,
      score: 80,
      light: "green",
    });
  });

  it("passes mortgage through unchanged when present, and omits it when not given", () => {
    const profile = buildProfile();
    const mortgage: MortgageExportData = {
      input: {
        homePrice: 3_000_000,
        homeOrder: 1,
        borrowerAge: 30,
        interestRatePercent: 6.5,
        loanTermYears: 30,
        downPaymentAvailable: 300000,
        monthlyIncome: 50000,
        existingDebt: 5000,
        dsrLimit: 0.4,
      },
      result: {
        maxLoan: 2_700_000,
        maxLoanByLtv: 3_000_000,
        maxLoanByDsr: 2_700_000,
        bindingConstraint: "dsr",
        ltvPercent: 1,
        requiredDownPayment: 0,
        affordableHomePrice: 3_000_000,
        canAffordTarget: true,
        monthlyPayment: 15000,
        dsrAfterLoan: 0.4,
        effectiveTermYears: 30,
        monthlyRate: 0.0054,
        numPayments: 360,
        ltvPolicyName: "temporary",
      },
    };

    const withMortgage = buildExportData({
      profile,
      cashFlowRows,
      health: {
        month: "2026-06",
        totals: { totalIncome: 50000, totalExpense: 20000, totalDebt: 5000, remainingCashFlow: 25000 },
        score: 85,
        light: "green",
        results: buildRatioResults(),
      },
      projection: buildProjection(),
      mortgage,
    });
    expect(withMortgage.mortgage).toBe(mortgage);

    const withoutMortgage = buildExportData({
      profile,
      cashFlowRows,
      health: {
        month: "2026-06",
        totals: { totalIncome: 50000, totalExpense: 20000, totalDebt: 5000, remainingCashFlow: 25000 },
        score: 85,
        light: "green",
        results: buildRatioResults(),
      },
      projection: buildProjection(),
    });
    expect(withoutMortgage.mortgage).toBeUndefined();
  });
});
