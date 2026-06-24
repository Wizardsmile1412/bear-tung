export interface LtvContext {
  homePrice: number;
  homeOrder: 1 | 2 | 3;
  firstHomePaidAtLeastTwoYears?: boolean; // only meaningful when homeOrder === 2
}

/**
 * Strategy interface for a date-based LTV (loan-to-value) rule set. Every
 * implementation is interchangeable (LSP) and `LtvPolicyFactory` selects
 * one by date without `MortgageService` knowing the details (DIP + OCP).
 */
export interface LtvPolicy {
  maxLtv(ctx: LtvContext): number; // 0-1
  readonly name: string; // e.g. 'temporary' | 'normal' — for the UI badge in a later phase
}
