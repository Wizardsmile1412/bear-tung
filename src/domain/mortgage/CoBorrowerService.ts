import { AmortizationCalculator } from "./AmortizationCalculator";

export interface CoBorrowerInput {
  homePrice: number;
  downPaymentAvailable: number;
  monthlyRate: number; // r, already computed by MortgageService for this scenario
  numPayments: number; // n, already computed
  userIncome: number;
  userDebt: number;
  coDebt: number;
  dsrLimit: number;
  maxLoanByLtv: number; // from the same MortgageService evaluation, to detect LTV-bound case
  coIncomeProvided?: number; // optional: if the user already knows the co-borrower's income
}

export interface CoBorrowerResult {
  isLtvBound: boolean; // true => co-borrower cannot help (insufficient down payment); requiredCoIncome is meaningless in this case
  alreadyQualifies: boolean; // sole borrower already meets DSR without a co-borrower => requiredCoIncome = 0
  requiredCoIncome: number; // minimum co-borrower income needed (0 if alreadyQualifies)
  combinedIncomeSufficient?: boolean; // only set when coIncomeProvided is given
}

/**
 * Computes the minimum co-borrower income needed to qualify for the target
 * home, per spec 8.5. Reuses `AmortizationCalculator` and the
 * already-computed `r`/`n`/`maxLoanByLtv` from a `MortgageService`
 * evaluation rather than recomputing the term cap independently.
 */
export class CoBorrowerService {
  evaluate(input: CoBorrowerInput): CoBorrowerResult {
    const loanNeeded = Math.max(0, input.homePrice - input.downPaymentAvailable);

    if (loanNeeded > input.maxLoanByLtv) {
      // A co-borrower's income cannot fix an LTV/down-payment shortfall.
      return { isLtvBound: true, alreadyQualifies: false, requiredCoIncome: 0 };
    }

    const monthlyPayment = AmortizationCalculator.payment(loanNeeded, input.monthlyRate, input.numPayments);
    const requiredCombinedIncome = (monthlyPayment + input.userDebt + input.coDebt) / input.dsrLimit;
    const requiredCoIncome = Math.max(0, requiredCombinedIncome - input.userIncome);
    const alreadyQualifies = requiredCoIncome === 0;

    const result: CoBorrowerResult = {
      isLtvBound: false,
      alreadyQualifies,
      requiredCoIncome,
    };

    if (input.coIncomeProvided !== undefined) {
      result.combinedIncomeSufficient = input.userIncome + input.coIncomeProvided >= requiredCombinedIncome;
    }

    return result;
  }
}
