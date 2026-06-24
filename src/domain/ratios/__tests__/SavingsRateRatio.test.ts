import { describe, expect, it } from "vitest";

import { MonthFinancials } from "../Ratio";
import { SavingsRateRatio } from "../SavingsRateRatio";

function financials(overrides: Partial<MonthFinancials>): MonthFinancials {
  return { income: 0, expense: 0, debt: 0, savings: 0, ...overrides };
}

describe("SavingsRateRatio", () => {
  const ratio = new SavingsRateRatio();

  it("computes a mid-range savings rate and score", () => {
    // income 40000, expense 30000, debt 5000 -> remaining 5000 -> rate 0.125
    const result = ratio.calculate(financials({ income: 40000, expense: 30000, debt: 5000 }));
    expect(result.value).toBeCloseTo(0.125, 5);
    // between 0.10 (score 60) and 0.20 (score 100): 60 + (0.025/0.10)*40 = 70
    expect(result.score).toBeCloseTo(70, 5);
    expect(result.status).toBe("warning");
  });

  it("guards divide-by-zero when income is 0", () => {
    const result = ratio.calculate(financials({ income: 0, expense: 0, debt: 0 }));
    expect(result.value).toBe(0);
    expect(Number.isNaN(result.value)).toBe(false);
    expect(result.score).toBe(30);
    expect(Number.isNaN(result.score)).toBe(false);
    expect(result.status).toBe("danger");
  });

  it("boundary: rate exactly 0 -> score 30 -> danger (start of the 0-10% 'needs work' band)", () => {
    const result = ratio.calculate(financials({ income: 10000, expense: 10000, debt: 0 }));
    expect(result.value).toBe(0);
    expect(result.score).toBe(30);
    expect(result.status).toBe("danger");
  });

  it("strictly inside the 0-10% band: rate 0.05 -> score 45 -> danger", () => {
    const result = ratio.calculate(financials({ income: 10000, expense: 9500, debt: 0 }));
    expect(result.value).toBeCloseTo(0.05, 5);
    expect(result.score).toBeCloseTo(45, 5);
    expect(result.status).toBe("danger");
  });

  it("boundary: rate exactly 0.10 -> score 60 -> warning", () => {
    const result = ratio.calculate(financials({ income: 10000, expense: 9000, debt: 0 }));
    expect(result.value).toBeCloseTo(0.1, 5);
    expect(result.score).toBeCloseTo(60, 5);
    expect(result.status).toBe("warning");
  });

  it("strictly inside the 10-20% band: rate 0.15 -> score 80 -> good", () => {
    const result = ratio.calculate(financials({ income: 10000, expense: 8500, debt: 0 }));
    expect(result.value).toBeCloseTo(0.15, 5);
    expect(result.score).toBeCloseTo(80, 5);
    expect(result.status).toBe("good");
  });

  it("boundary: rate exactly 0.20 -> score 100 -> good", () => {
    const result = ratio.calculate(financials({ income: 10000, expense: 8000, debt: 0 }));
    expect(result.value).toBeCloseTo(0.2, 5);
    expect(result.score).toBeCloseTo(100, 5);
    expect(result.status).toBe("good");
  });

  it("negative rate (overspending) continues the same downward slope, e.g. -0.05 -> score 15", () => {
    const result = ratio.calculate(financials({ income: 10000, expense: 10500, debt: 0 }));
    expect(result.value).toBeCloseTo(-0.05, 5);
    expect(result.score).toBeCloseTo(15, 5);
    expect(result.status).toBe("danger");
  });

  it("negative rate at or beyond the -10% floor clamps score to 0", () => {
    const atFloor = ratio.calculate(financials({ income: 10000, expense: 11000, debt: 0 }));
    expect(atFloor.value).toBeCloseTo(-0.1, 5);
    expect(atFloor.score).toBe(0);

    const beyondFloor = ratio.calculate(financials({ income: 10000, expense: 15000, debt: 0 }));
    expect(beyondFloor.value).toBeLessThan(-0.1);
    expect(beyondFloor.score).toBe(0);
    expect(beyondFloor.status).toBe("danger");
  });

  it("rate above 0.20 caps score at 100", () => {
    const result = ratio.calculate(financials({ income: 10000, expense: 2000, debt: 0 }));
    expect(result.value).toBeGreaterThan(0.2);
    expect(result.score).toBe(100);
  });

  it("has the expected key and label", () => {
    const result = ratio.calculate(financials({ income: 10000 }));
    expect(result.key).toBe("savingsRate");
    expect(result.label).toBe("อัตราการออม (Savings Rate)");
  });
});
