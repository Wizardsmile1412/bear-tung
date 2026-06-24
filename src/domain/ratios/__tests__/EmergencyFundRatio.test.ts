import { describe, expect, it } from "vitest";

import { EmergencyFundRatio } from "../EmergencyFundRatio";
import { MonthFinancials } from "../Ratio";

function financials(overrides: Partial<MonthFinancials>): MonthFinancials {
  return { income: 0, expense: 0, debt: 0, savings: 0, ...overrides };
}

describe("EmergencyFundRatio", () => {
  const ratio = new EmergencyFundRatio();

  it("computes a mid-range emergency-fund months value and score", () => {
    // burn = expense+debt = 10000, savings = 40000 -> 4 months
    const result = ratio.calculate(financials({ expense: 8000, debt: 2000, savings: 40000 }));
    expect(result.value).toBeCloseTo(4, 5);
    // between 3 (60) and 6 (100): 60 + (4-3)/3*40 = 60 + 13.33 = 73.33
    expect(result.score).toBeCloseTo(73.333, 2);
    expect(result.status).toBe("warning");
  });

  it("zero burn (no expense, no debt) -> value Infinity, score 100, status good", () => {
    const result = ratio.calculate(financials({ expense: 0, debt: 0, savings: 0 }));
    expect(result.value).toBe(Infinity);
    expect(result.score).toBe(100);
    expect(result.status).toBe("good");
    expect(Number.isNaN(result.value)).toBe(false);
  });

  it("boundary: exactly 6 months -> score 100 -> good", () => {
    const result = ratio.calculate(financials({ expense: 10000, debt: 0, savings: 60000 }));
    expect(result.value).toBeCloseTo(6, 5);
    expect(result.score).toBe(100);
    expect(result.status).toBe("good");
  });

  it("boundary: exactly 3 months -> score 60 -> warning", () => {
    const result = ratio.calculate(financials({ expense: 10000, debt: 0, savings: 30000 }));
    expect(result.value).toBeCloseTo(3, 5);
    expect(result.score).toBeCloseTo(60, 5);
    expect(result.status).toBe("warning");
  });

  it("strictly inside the 1-3 month band: 2 months -> score 45 -> danger", () => {
    const result = ratio.calculate(financials({ expense: 10000, debt: 0, savings: 20000 }));
    expect(result.value).toBeCloseTo(2, 5);
    // 30 + (2-1)/2*30 = 30 + 15 = 45
    expect(result.score).toBeCloseTo(45, 5);
    expect(result.status).toBe("danger");
  });

  it("boundary: exactly 1 month -> score 30 -> danger", () => {
    const result = ratio.calculate(financials({ expense: 10000, debt: 0, savings: 10000 }));
    expect(result.value).toBeCloseTo(1, 5);
    expect(result.score).toBeCloseTo(30, 5);
    expect(result.status).toBe("danger");
  });

  it("strictly inside the <1 month band: 0.5 months -> score 15 -> danger", () => {
    const result = ratio.calculate(financials({ expense: 10000, debt: 0, savings: 5000 }));
    expect(result.value).toBeCloseTo(0.5, 5);
    // (0.5/1)*30 = 15
    expect(result.score).toBeCloseTo(15, 5);
    expect(result.status).toBe("danger");
  });

  it("zero savings with non-zero burn -> value 0, score 0, danger", () => {
    const result = ratio.calculate(financials({ expense: 10000, debt: 0, savings: 0 }));
    expect(result.value).toBe(0);
    expect(result.score).toBe(0);
    expect(result.status).toBe("danger");
  });

  it("has the expected key and label", () => {
    const result = ratio.calculate(financials({ expense: 1000, savings: 1000 }));
    expect(result.key).toBe("emergencyFund");
    expect(result.label).toBe("เงินสำรองฉุกเฉิน (Emergency Fund)");
  });
});
