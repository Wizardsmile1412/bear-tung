import { RatioResult } from "@/domain/ratios/Ratio";

/**
 * Presentation-only formatting for a `RatioResult.value`, specific to how
 * this page displays each ratio. Not a domain concern — the domain layer
 * only produces the raw numeric value (and `Infinity` for emergencyFund
 * when there is no monthly burn at all).
 */
export function formatRatioValue(result: RatioResult): string {
  switch (result.key) {
    case "savingsRate":
    case "dsr":
      return `${Math.round(result.value * 100)}%`;
    case "emergencyFund":
      return Number.isFinite(result.value) ? `${result.value.toFixed(1)} เดือน` : "ไม่มีภาระรายจ่าย/หนี้";
    default:
      return String(result.value);
  }
}
