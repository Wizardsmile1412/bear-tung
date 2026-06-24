import { describe, expect, it } from "vitest";

import { DsrRatio } from "../DsrRatio";
import { MonthFinancials } from "../Ratio";

function financials(overrides: Partial<MonthFinancials>): MonthFinancials {
  return { income: 0, expense: 0, debt: 0, savings: 0, ...overrides };
}

describe("DsrRatio", () => {
  const ratio = new DsrRatio();

  it("computes a mid-range DSR and score", () => {
    // debt 5000 / income 10000 = 0.50 -> between 0.40 (70) and 0.60 (30)... wait recompute
    const result = ratio.calculate(financials({ income: 10000, debt: 5000 }));
    expect(result.value).toBeCloseTo(0.5, 5);
    // 0.40 < 0.5 <= 0.60: 30 + (0.60-0.5)/0.20*40 = 30 + 20 = 50
    expect(result.score).toBeCloseTo(50, 5);
    expect(result.status).toBe("warning");
  });

  it("guards divide-by-zero: income 0 with any debt -> value 1 (worst case), score 0, no NaN", () => {
    const result = ratio.calculate(financials({ income: 0, debt: 1000 }));
    expect(result.value).toBe(1);
    expect(Number.isNaN(result.value)).toBe(false);
    expect(result.score).toBe(0);
    expect(Number.isNaN(result.score)).toBe(false);
    expect(result.status).toBe("danger");
  });

  it("guards divide-by-zero: income 0 with no debt -> still value 1 by definition, score 0, no NaN", () => {
    const result = ratio.calculate(financials({ income: 0, debt: 0 }));
    expect(result.value).toBe(1);
    expect(Number.isNaN(result.value)).toBe(false);
    expect(result.score).toBe(0);
    expect(Number.isNaN(result.score)).toBe(false);
  });

  it("boundary: DSR exactly 0.30 -> score 100 -> good", () => {
    const result = ratio.calculate(financials({ income: 10000, debt: 3000 }));
    expect(result.value).toBeCloseTo(0.3, 5);
    expect(result.score).toBe(100);
    expect(result.status).toBe("good");
  });

  it("strictly inside the 30-40% band: DSR 0.35 -> score 85 -> good", () => {
    const result = ratio.calculate(financials({ income: 10000, debt: 3500 }));
    expect(result.value).toBeCloseTo(0.35, 5);
    // 70 + (0.40-0.35)/0.10*30 = 70 + 15 = 85
    expect(result.score).toBeCloseTo(85, 5);
    expect(result.status).toBe("good");
  });

  it("boundary: DSR exactly 0.40 -> score 70 -> warning", () => {
    const result = ratio.calculate(financials({ income: 10000, debt: 4000 }));
    expect(result.value).toBeCloseTo(0.4, 5);
    expect(result.score).toBeCloseTo(70, 5);
    expect(result.status).toBe("warning");
  });

  it("boundary: DSR exactly 0.60 -> score 30 -> danger", () => {
    const result = ratio.calculate(financials({ income: 10000, debt: 6000 }));
    expect(result.value).toBeCloseTo(0.6, 5);
    expect(result.score).toBeCloseTo(30, 5);
    expect(result.status).toBe("danger");
  });

  it("strictly inside the >60% band: DSR 0.8 -> score 15 -> danger", () => {
    const result = ratio.calculate(financials({ income: 10000, debt: 8000 }));
    expect(result.value).toBeCloseTo(0.8, 5);
    // max(0, 30*(1-(0.8-0.6)/0.4)) = 30*(1-0.5) = 15
    expect(result.score).toBeCloseTo(15, 5);
    expect(result.status).toBe("danger");
  });

  it("DSR above 1.0 (debt exceeds income) clamps score to 0", () => {
    const result = ratio.calculate(financials({ income: 10000, debt: 14000 }));
    expect(result.value).toBeGreaterThan(1);
    expect(result.score).toBe(0);
    expect(result.status).toBe("danger");
  });

  it("DSR of 0 -> score 100 -> good", () => {
    const result = ratio.calculate(financials({ income: 10000, debt: 0 }));
    expect(result.value).toBe(0);
    expect(result.score).toBe(100);
    expect(result.status).toBe("good");
  });

  it("has the expected key and label", () => {
    const result = ratio.calculate(financials({ income: 10000, debt: 1000 }));
    expect(result.key).toBe("dsr");
    expect(result.label).toBe("DSR (สัดส่วนภาระหนี้ต่อรายได้)");
  });
});
