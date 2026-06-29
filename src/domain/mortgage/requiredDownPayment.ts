import { LtvPolicyFactory } from "./LtvPolicyFactory";

export interface RequiredDownPaymentInput {
  homePrice: number;
  homeOrder: 1 | 2 | 3;
  firstHomePaidAtLeastTwoYears?: boolean; // only meaningful when homeOrder === 2
  assessmentDate?: Date; // defaults to now; picks the date-based LTV policy
}

/**
 * Minimum down payment the active LTV rule requires for this home at the given
 * assessment date: `homePrice * (1 - maxLtv)`.
 *
 * Mirrors how `MortgageService` derives `requiredDownPayment`, but depends only
 * on the LTV-relevant inputs — so the UI can pre-fill the "down payment you
 * have" field with the minimum needed before a full mortgage evaluation exists.
 * Returns 0 when no down payment is required (e.g. 100% LTV, or homePrice 0).
 */
export function requiredDownPayment(input: RequiredDownPaymentInput): number {
  const policy = LtvPolicyFactory.forDate(input.assessmentDate ?? new Date());
  const maxLtv = policy.maxLtv({
    homePrice: input.homePrice,
    homeOrder: input.homeOrder,
    firstHomePaidAtLeastTwoYears: input.firstHomePaidAtLeastTwoYears,
  });
  // Round to whole baht (money is whole-baht in this app) — also sidesteps
  // float noise like 12_000_000 * (1 - 0.9) = 1_199_999.9999999998.
  return Math.round(input.homePrice * (1 - maxLtv));
}
