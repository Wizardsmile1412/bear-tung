import { describe, expect, it } from "vitest";

import { MonthFinancials, Ratio, RatioResult } from "../../ratios/Ratio";
import { HealthScoreService } from "../HealthScoreService";

/** A fake Ratio that always returns a fixed score, for testing without the real ratio classes. */
class FixedScoreRatio implements Ratio {
  constructor(
    private readonly key: string,
    private readonly fixedScore: number,
  ) {}

  calculate(): RatioResult {
    return {
      key: this.key,
      label: this.key,
      value: 0,
      score: this.fixedScore,
      status: this.fixedScore >= 80 ? "good" : this.fixedScore >= 50 ? "warning" : "danger",
    };
  }
}

const dummyFinancials: MonthFinancials = { income: 0, expense: 0, debt: 0, savings: 0 };

describe("HealthScoreService", () => {
  it("computes the correct weighted score using fake ratios (proves DIP/mockability)", () => {
    const service = new HealthScoreService([
      { ratio: new FixedScoreRatio("a", 100), weight: 0.35 },
      { ratio: new FixedScoreRatio("b", 100), weight: 0.35 },
      { ratio: new FixedScoreRatio("c", 100), weight: 0.3 },
    ]);

    const evaluation = service.evaluate(dummyFinancials);

    // 0.35*100 + 0.35*100 + 0.30*100 = 100
    expect(evaluation.score).toBe(100);
    expect(evaluation.light).toBe("green");
    expect(evaluation.results).toHaveLength(3);
  });

  it("computes a known weighted score for mixed ratio scores (35/35/30 weights)", () => {
    const service = new HealthScoreService([
      { ratio: new FixedScoreRatio("savingsRate", 80), weight: 0.35 },
      { ratio: new FixedScoreRatio("dsr", 60), weight: 0.35 },
      { ratio: new FixedScoreRatio("emergencyFund", 40), weight: 0.3 },
    ]);

    const evaluation = service.evaluate(dummyFinancials);

    // 0.35*80 + 0.35*60 + 0.30*40 = 28 + 21 + 12 = 61
    expect(evaluation.score).toBe(61);
    expect(evaluation.light).toBe("yellow");
  });

  it("only calls calculate() once per ratio per evaluate() call (no redundant computation)", () => {
    let callCount = 0;
    const countingRatio: Ratio = {
      calculate(): RatioResult {
        callCount += 1;
        return { key: "counting", label: "counting", value: 0, score: 100, status: "good" };
      },
    };

    const service = new HealthScoreService([{ ratio: countingRatio, weight: 1 }]);
    service.evaluate(dummyFinancials);

    expect(callCount).toBe(1);
  });

  it("traffic light: score 80 -> green", () => {
    const service = new HealthScoreService([{ ratio: new FixedScoreRatio("a", 80), weight: 1 }]);
    expect(service.evaluate(dummyFinancials).light).toBe("green");
  });

  it("traffic light: score 79 -> yellow", () => {
    const service = new HealthScoreService([{ ratio: new FixedScoreRatio("a", 79), weight: 1 }]);
    expect(service.evaluate(dummyFinancials).light).toBe("yellow");
  });

  it("traffic light: score 50 -> yellow", () => {
    const service = new HealthScoreService([{ ratio: new FixedScoreRatio("a", 50), weight: 1 }]);
    expect(service.evaluate(dummyFinancials).light).toBe("yellow");
  });

  it("traffic light: score 49 -> red", () => {
    const service = new HealthScoreService([{ ratio: new FixedScoreRatio("a", 49), weight: 1 }]);
    expect(service.evaluate(dummyFinancials).light).toBe("red");
  });
});
