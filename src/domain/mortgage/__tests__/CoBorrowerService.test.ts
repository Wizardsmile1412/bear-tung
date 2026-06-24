import { describe, expect, it } from "vitest";

import { AmortizationCalculator } from "../AmortizationCalculator";
import { CoBorrowerInput, CoBorrowerService } from "../CoBorrowerService";

function baseInput(overrides: Partial<CoBorrowerInput> = {}): CoBorrowerInput {
  const r = AmortizationCalculator.monthlyRate(6.5);
  const n = 360;
  return {
    homePrice: 4_000_000,
    downPaymentAvailable: 1_000_000,
    monthlyRate: r,
    numPayments: n,
    userIncome: 35000,
    userDebt: 5000,
    coDebt: 3000,
    dsrLimit: 0.4,
    maxLoanByLtv: 4_000_000, // not LTV-bound by default
    ...overrides,
  };
}

describe("CoBorrowerService", () => {
  const service = new CoBorrowerService();

  it("matches the spec's worked example: requiredCoIncome ~= 32,405", () => {
    const result = service.evaluate(baseInput());

    expect(result.isLtvBound).toBe(false);
    expect(result.alreadyQualifies).toBe(false);
    expect(Math.abs(result.requiredCoIncome - 32405)).toBeLessThan(50);
  });

  it("already qualifies without a co-borrower when income is high enough", () => {
    const result = service.evaluate(baseInput({ userIncome: 200000, userDebt: 0, coDebt: 0 }));

    expect(result.alreadyQualifies).toBe(true);
    expect(result.requiredCoIncome).toBe(0);
  });

  it("LTV-bound: loanNeeded exceeds maxLoanByLtv -> co-borrower cannot help", () => {
    const result = service.evaluate(
      baseInput({ homePrice: 4_000_000, downPaymentAvailable: 1_000_000, maxLoanByLtv: 2_000_000 }),
    );

    // loanNeeded = 3,000,000 > maxLoanByLtv = 2,000,000
    expect(result.isLtvBound).toBe(true);
    expect(result.alreadyQualifies).toBe(false);
    expect(result.requiredCoIncome).toBe(0);
  });

  it("when coIncomeProvided is given, reports whether the combined income is sufficient (sufficient case)", () => {
    const result = service.evaluate(baseInput({ coIncomeProvided: 40000 }));
    expect(result.combinedIncomeSufficient).toBe(true);
  });

  it("when coIncomeProvided is given, reports whether the combined income is sufficient (insufficient case)", () => {
    const result = service.evaluate(baseInput({ coIncomeProvided: 5000 }));
    expect(result.combinedIncomeSufficient).toBe(false);
  });

  it("combinedIncomeSufficient is left undefined when coIncomeProvided is not given", () => {
    const result = service.evaluate(baseInput());
    expect(result.combinedIncomeSufficient).toBeUndefined();
  });
});
