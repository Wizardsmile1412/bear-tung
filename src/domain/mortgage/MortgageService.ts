import { MAX_AGE_PLUS_TERM } from "../config/defaults";
import { AmortizationCalculator } from "./AmortizationCalculator";
import { LtvPolicy } from "./LtvPolicy";
import { LtvPolicyFactory } from "./LtvPolicyFactory";

export interface MortgageInput {
  homePrice: number;
  homeOrder: 1 | 2 | 3;
  firstHomePaidAtLeastTwoYears?: boolean;
  borrowerAge: number;
  interestRatePercent: number;
  loanTermYears: number;
  downPaymentAvailable: number;
  monthlyIncome: number;
  existingDebt: number;
  dsrLimit: number; // 0-1
  assessmentDate?: Date; // defaults to `new Date()` if omitted — used only to pick the LTV policy
}

export interface MortgageResult {
  maxLoan: number;
  maxLoanByLtv: number;
  maxLoanByDsr: number;
  bindingConstraint: "ltv" | "dsr";
  ltvPercent: number;
  requiredDownPayment: number;
  affordableHomePrice: number;
  canAffordTarget: boolean;
  monthlyPayment: number; // payment for financing the TARGET home (homePrice - downPaymentAvailable), not maxLoan
  dsrAfterLoan: number; // (monthlyPayment + existingDebt) / monthlyIncome, guard income<=0 -> 0
  effectiveTermYears: number; // min(loanTermYears, 70 - borrowerAge), floored at 1
  monthlyRate: number; // r, exposed so CoBorrowerService can reuse it without recomputing
  numPayments: number; // n, exposed so CoBorrowerService can reuse it without recomputing
  ltvPolicyName: string; // the active LtvPolicy's name (e.g. 'temporary' | 'normal'), for the UI badge
}

/**
 * Facade combining LTV policy + DSR affordability + amortization + the
 * age/term cap into one mortgage-affordability result. Depends on
 * `LtvPolicyFactory` by default but accepts an injected `LtvPolicy` factory
 * function (DIP) so it can be tested with a fake policy, without needing a
 * real date.
 */
export class MortgageService {
  constructor(
    private readonly resolveLtvPolicy: (date: Date) => LtvPolicy = LtvPolicyFactory.forDate,
  ) {}

  evaluate(input: MortgageInput): MortgageResult {
    const effectiveTermYears = Math.max(1, Math.min(input.loanTermYears, MAX_AGE_PLUS_TERM - input.borrowerAge));
    const monthlyRate = AmortizationCalculator.monthlyRate(input.interestRatePercent);
    const numPayments = effectiveTermYears * 12;

    const ltvPolicy = this.resolveLtvPolicy(input.assessmentDate ?? new Date());
    const ltvPercent = ltvPolicy.maxLtv({
      homePrice: input.homePrice,
      homeOrder: input.homeOrder,
      firstHomePaidAtLeastTwoYears: input.firstHomePaidAtLeastTwoYears,
    });

    const maxLoanByLtv = input.homePrice * ltvPercent;
    const requiredDownPayment = input.homePrice - maxLoanByLtv;

    const affordableMonthlyPayment = Math.max(0, input.dsrLimit * input.monthlyIncome - input.existingDebt);
    const maxLoanByDsr = AmortizationCalculator.maxLoanFromPayment(affordableMonthlyPayment, monthlyRate, numPayments);

    const maxLoan = Math.min(maxLoanByLtv, maxLoanByDsr);
    const bindingConstraint: "ltv" | "dsr" = maxLoanByLtv <= maxLoanByDsr ? "ltv" : "dsr";

    const affordableHomePrice = maxLoan + input.downPaymentAvailable;
    const canAffordTarget =
      affordableHomePrice >= input.homePrice && input.downPaymentAvailable >= requiredDownPayment;

    const loanForTarget = Math.max(0, input.homePrice - input.downPaymentAvailable);
    const monthlyPayment = AmortizationCalculator.payment(loanForTarget, monthlyRate, numPayments);

    const dsrAfterLoan = input.monthlyIncome > 0 ? (monthlyPayment + input.existingDebt) / input.monthlyIncome : 0;

    return {
      maxLoan,
      maxLoanByLtv,
      maxLoanByDsr,
      bindingConstraint,
      ltvPercent,
      requiredDownPayment,
      affordableHomePrice,
      canAffordTarget,
      monthlyPayment,
      dsrAfterLoan,
      effectiveTermYears,
      monthlyRate,
      numPayments,
      ltvPolicyName: ltvPolicy.name,
    };
  }
}
