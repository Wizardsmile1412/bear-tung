import { CoBorrowerResult, CoBorrowerService } from "@/domain/mortgage/CoBorrowerService";
import { MortgageInput, MortgageResult, MortgageService } from "@/domain/mortgage/MortgageService";

// Stateless pure services — safe to create once at module scope rather than
// per-render or per-component-instance (same justification as
// useHealth.ts's module-level healthScoreService singleton).
const mortgageService = new MortgageService();
const coBorrowerService = new CoBorrowerService();

/**
 * Evaluates mortgage affordability for the given input.
 *
 * Deliberately NOT wrapped in `useMemo`: unlike the 60-month projection
 * series (genuinely expensive, memoized via useProjectionSeries), a single
 * mortgage evaluation is trivial synchronous arithmetic. Memoizing against
 * an object-literal `input` would create a new dependency reference every
 * render anyway, defeating the memo for zero real benefit.
 */
export function useMortgage(input: MortgageInput): MortgageResult {
  return mortgageService.evaluate(input);
}

export interface UseCoBorrowerInput {
  homePrice: number;
  downPaymentAvailable: number;
  userIncome: number;
  userDebt: number;
  coDebt: number;
  dsrLimit: number;
  coIncomeProvided?: number;
}

/**
 * Evaluates the co-borrower scenario given an already-computed
 * MortgageResult (reuses its `monthlyRate`/`numPayments`/`maxLoanByLtv`
 * rather than recomputing the term cap independently).
 */
export function useCoBorrower(mortgageResult: MortgageResult, input: UseCoBorrowerInput): CoBorrowerResult {
  return coBorrowerService.evaluate({
    homePrice: input.homePrice,
    downPaymentAvailable: input.downPaymentAvailable,
    monthlyRate: mortgageResult.monthlyRate,
    numPayments: mortgageResult.numPayments,
    userIncome: input.userIncome,
    userDebt: input.userDebt,
    coDebt: input.coDebt,
    dsrLimit: input.dsrLimit,
    maxLoanByLtv: mortgageResult.maxLoanByLtv,
    coIncomeProvided: input.coIncomeProvided,
  });
}
