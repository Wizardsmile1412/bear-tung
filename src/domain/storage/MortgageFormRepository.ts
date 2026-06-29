/**
 * Serializable snapshot of the mortgage page's form inputs, persisted so the
 * form survives navigating away and back (the form is otherwise component-local
 * React state). Treated as part of the user's data: written on every change,
 * seeded by an Excel import, and cleared by the "reset all data" action.
 *
 * Mirrors the page's own state shape (e.g. `dsrLimitPercent` as 0-100, the
 * `selectedIndex` assessment month) so it round-trips with no lossy conversion.
 */
/**
 * How the down payment value is derived:
 * - `auto`   — the LTV-based suggested default (recomputes with the inputs)
 * - `pct5` / `pct10` — a fixed % of the home price (recomputes as price changes)
 * - `manual` — a value the user typed
 */
export type DownPaymentMode = "auto" | "pct5" | "pct10" | "manual";

export interface MortgageFormState {
  selectedIndex: number;
  homePrice: number;
  homeOrder: 1 | 2 | 3;
  firstHomePaidAtLeastTwoYears: boolean;
  borrowerAge: number;
  downPaymentAvailable: number;
  /** How the down payment was chosen (drives the 5%/10% quick-select + auto-fill). */
  downPaymentMode: DownPaymentMode;
  interestRatePercent: number;
  loanTermYears: number;
  dsrLimitPercent: number;
  coBorrowerEnabled: boolean;
  coDebt: number;
  coIncomeProvided?: number;
}

/**
 * Repository abstraction (DIP) for the persisted mortgage form. Separate from
 * `ProfileRepository` (ISP) — different lifecycle and shape — but, like it,
 * holds user-owned data, so it's cleared alongside the profile on reset.
 */
export interface MortgageFormRepository {
  load(): MortgageFormState | null;
  save(state: MortgageFormState): void;
  clear(): void;
}
