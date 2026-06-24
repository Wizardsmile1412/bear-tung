import { LtvContext, LtvPolicy } from "./LtvPolicy";

/**
 * Normal LTV rules (after the temporary relaxation ends), per spec 8.2:
 * - 1st home, price < 10M: 100% LTV (the "+10% furnishing" top-up some
 *   banks offer is out of scope for this MVP's loan-to-home-price calc).
 * - 1st home, price >= 10M: 90% LTV.
 * - 2nd home, 1st home paid >= 2 years: 90% LTV.
 * - 2nd home, 1st home paid < 2 years: 80% LTV.
 * - 3rd+ home: 70% LTV regardless of price.
 */
export class NormalLtvPolicy implements LtvPolicy {
  readonly name = "normal";

  maxLtv(ctx: LtvContext): number {
    if (ctx.homeOrder === 1) {
      return ctx.homePrice < 10_000_000 ? 1.0 : 0.9;
    }
    if (ctx.homeOrder === 2) {
      return ctx.firstHomePaidAtLeastTwoYears ? 0.9 : 0.8;
    }
    return 0.7; // 3rd+ home
  }
}
