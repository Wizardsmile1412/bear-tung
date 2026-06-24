import { MonthFinancials, Ratio, RatioResult } from "../ratios/Ratio";

export interface WeightedRatio {
  ratio: Ratio;
  weight: number;
}

export interface HealthEvaluation {
  score: number;
  light: "green" | "yellow" | "red";
  results: RatioResult[];
}

/**
 * Combines a weighted set of `Ratio` strategies into one 0-100 health score
 * + traffic light. Depends only on the `Ratio` abstraction (DIP) so it can
 * be tested with fake ratios and extended with new ones without changes
 * (OCP).
 */
export class HealthScoreService {
  constructor(private readonly items: WeightedRatio[]) {}

  evaluate(m: MonthFinancials): HealthEvaluation {
    const results = this.items.map(({ ratio }) => ratio.calculate(m));
    const total = this.items.reduce((sum, { weight }, i) => sum + results[i].score * weight, 0);
    const score = Math.round(total);
    const light = score >= 80 ? "green" : score >= 50 ? "yellow" : "red";
    return { score, light, results };
  }
}
