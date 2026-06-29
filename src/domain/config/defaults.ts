// Storage key for the persisted CashFlowProfile (Phase 1).
export const PROFILE_STORAGE_KEY = "bear-tung:profile";

// Storage key for the persisted mortgage form inputs (survives navigation;
// also seeded by an Excel import). Part of the user's data — cleared on reset.
export const MORTGAGE_FORM_STORAGE_KEY = "bear-tung:mortgage-form";

// Phase 2 — mortgage + scoring defaults. Adjustable by the user in the UI;
// these are just the initial values pre-filled into forms.

/** Default annual interest rate (%), ref. Thai commercial bank MRR. */
export const DEFAULT_INTEREST_RATE_PERCENT = 6.5;

/** Default loan term in years (capped per-borrower by `MAX_AGE_PLUS_TERM`). */
export const DEFAULT_LOAN_TERM_YEARS = 30;

/** Default DSR (debt service ratio) cap used for affordability checks. */
export const DEFAULT_DSR_LIMIT = 0.4;

/** Most Thai banks require borrowerAge + loanTermYears <= this value. */
export const MAX_AGE_PLUS_TERM = 70;

/** Health score weights: savings rate 35%, DSR 35%, emergency fund 30%. */
export const HEALTH_SCORE_WEIGHTS = {
  savingsRate: 0.35,
  dsr: 0.35,
  emergencyFund: 0.3,
} as const;

/** Last day the temporary 100% LTV relaxation applies (inclusive). BOT extended it 1 more year per ฉบับที่ 19/2569 (14 พ.ค. 2569). */
export const LTV_RELAXATION_END_DATE = "2027-06-30";

/** Length of the projection series in months (5 years). */
export const PROJECTION_MONTHS = 60;
