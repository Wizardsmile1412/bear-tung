import { HEALTH_SCORE_WEIGHTS } from "../config/defaults";
import { DsrRatio } from "../ratios/DsrRatio";
import { EmergencyFundRatio } from "../ratios/EmergencyFundRatio";
import { SavingsRateRatio } from "../ratios/SavingsRateRatio";
import { HealthScoreService } from "./HealthScoreService";

/**
 * Composition root for `HealthScoreService`: wires the 3 ratios with the
 * configured weights. Nothing outside this factory should `new` a concrete
 * `Ratio` directly — callers (UI, ProjectionService default wiring, etc.)
 * should go through this function instead.
 */
export function createHealthScoreService(): HealthScoreService {
  return new HealthScoreService([
    { ratio: new SavingsRateRatio(), weight: HEALTH_SCORE_WEIGHTS.savingsRate },
    { ratio: new DsrRatio(), weight: HEALTH_SCORE_WEIGHTS.dsr },
    { ratio: new EmergencyFundRatio(), weight: HEALTH_SCORE_WEIGHTS.emergencyFund },
  ]);
}
