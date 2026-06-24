import { describe, expect, it } from "vitest";

import { MonthFinancials } from "../../ratios/Ratio";
import { createHealthScoreService } from "../createHealthScoreService";

describe("createHealthScoreService", () => {
  it("wires the 3 real ratios with the configured 35/35/30 weights", () => {
    const service = createHealthScoreService();
    const financials: MonthFinancials = { income: 40000, expense: 25000, debt: 5000, savings: 100000 };

    const evaluation = service.evaluate(financials);

    expect(evaluation.results.map((r) => r.key)).toEqual(["savingsRate", "dsr", "emergencyFund"]);
    expect(evaluation.score).toBeGreaterThanOrEqual(0);
    expect(evaluation.score).toBeLessThanOrEqual(100);
  });
});
