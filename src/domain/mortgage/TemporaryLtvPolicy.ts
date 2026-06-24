import { LtvContext, LtvPolicy } from "./LtvPolicy";

/**
 * BOT temporary relaxation (1 May 2025 - 30 Jun 2026): LTV 100% in all
 * cases, all price tiers, all home orders.
 */
export class TemporaryLtvPolicy implements LtvPolicy {
  readonly name = "temporary";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- ctx kept for LtvPolicy call-site signature compatibility
  maxLtv(ctx: LtvContext): number {
    return 1.0;
  }
}
