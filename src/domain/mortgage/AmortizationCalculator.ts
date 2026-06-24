/**
 * Pure amortization math (SRP — this class only does amortization
 * formulas, no state, no policy decisions). All methods are static.
 */
export class AmortizationCalculator {
  /** Converts an annual rate in percent (e.g. 6.5) to a monthly rate (e.g. ~0.00542). */
  static monthlyRate(annualRatePercent: number): number {
    return annualRatePercent / 12 / 100;
  }

  /**
   * Standard amortization formula: the level monthly payment that fully
   * repays `principal` over `numPayments` months at `monthlyRate`.
   * Degenerate `numPayments <= 0` returns `principal` rather than dividing
   * by zero or throwing (shouldn't normally happen given the term-cap
   * clamp in MortgageService).
   */
  static payment(principal: number, monthlyRate: number, numPayments: number): number {
    if (numPayments <= 0) return principal;
    if (monthlyRate === 0) return principal / numPayments;
    const factor = (1 + monthlyRate) ** numPayments;
    return (principal * monthlyRate * factor) / (factor - 1);
  }

  /**
   * Inverse of `payment`: the maximum principal that can be financed by a
   * given monthly `payment` over `numPayments` months at `monthlyRate`.
   */
  static maxLoanFromPayment(payment: number, monthlyRate: number, numPayments: number): number {
    if (payment <= 0) return 0;
    if (monthlyRate === 0) return payment * numPayments;
    return (payment * (1 - (1 + monthlyRate) ** -numPayments)) / monthlyRate;
  }
}
