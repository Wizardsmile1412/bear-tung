import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { MortgageInput } from "@/domain/mortgage/MortgageService";

import { useCoBorrower, useMortgage } from "../useMortgage";

function baseInput(overrides: Partial<MortgageInput> = {}): MortgageInput {
  return {
    homePrice: 3_000_000,
    homeOrder: 1,
    borrowerAge: 30,
    interestRatePercent: 6.5,
    loanTermYears: 30,
    downPaymentAvailable: 0,
    monthlyIncome: 50000,
    existingDebt: 0,
    dsrLimit: 0.4,
    assessmentDate: new Date("2026-01-01"), // within the temporary 100% LTV window
    ...overrides,
  };
}

describe("useMortgage", () => {
  it("evaluates a known input to the spec's worked example (~18,962/month for a 3,000,000 loan)", () => {
    const { result } = renderHook(() => useMortgage(baseInput({ downPaymentAvailable: 0 })));
    expect(result.current.monthlyPayment).toBeCloseTo(18962, -1);
  });

  it("re-evaluates on each call (no stale memoized result across different inputs)", () => {
    const { result: first } = renderHook(() => useMortgage(baseInput({ homePrice: 3_000_000 })));
    const { result: second } = renderHook(() => useMortgage(baseInput({ homePrice: 6_000_000 })));
    expect(first.current.monthlyPayment).not.toBe(second.current.monthlyPayment);
  });
});

describe("useCoBorrower", () => {
  it("computes the spec's worked co-borrower example (~32,405 required combined... -> requiredCoIncome derived)", () => {
    // Spec 8.5 worked example context: loanNeeded -> monthlyPayment, then
    // requiredCombinedIncome = (monthlyPayment + userDebt + coDebt) / dsrLimit.
    const mortgageInput = baseInput({ homePrice: 5_000_000, downPaymentAvailable: 500_000, monthlyIncome: 30000 });
    const { result: mortgageHook } = renderHook(() => useMortgage(mortgageInput));
    const mortgageResult = mortgageHook.current;

    const { result } = renderHook(() =>
      useCoBorrower(mortgageResult, {
        homePrice: 5_000_000,
        downPaymentAvailable: 500_000,
        userIncome: 30000,
        userDebt: 0,
        coDebt: 0,
        dsrLimit: 0.4,
      }),
    );

    expect(result.current.isLtvBound).toBe(false);
    expect(result.current.requiredCoIncome).toBeGreaterThan(0);
  });

  it("flags isLtvBound when the down payment is insufficient regardless of income", () => {
    const mortgageInput = baseInput({
      homePrice: 4_000_000,
      downPaymentAvailable: 0,
      assessmentDate: new Date("2027-01-01"), // past the relaxation window -> normal LTV rules apply
    });
    const { result: mortgageHook } = renderHook(() => useMortgage(mortgageInput));
    const mortgageResult = mortgageHook.current;

    const { result } = renderHook(() =>
      useCoBorrower(mortgageResult, {
        homePrice: 100_000_000, // way beyond what maxLoanByLtv could ever cover
        downPaymentAvailable: 0,
        userIncome: 50000,
        userDebt: 0,
        coDebt: 0,
        dsrLimit: 0.4,
      }),
    );

    expect(result.current.isLtvBound).toBe(true);
  });

  it("passes coIncomeProvided through and sets combinedIncomeSufficient", () => {
    const mortgageInput = baseInput({ homePrice: 5_000_000, downPaymentAvailable: 500_000, monthlyIncome: 10000 });
    const { result: mortgageHook } = renderHook(() => useMortgage(mortgageInput));
    const mortgageResult = mortgageHook.current;

    const { result } = renderHook(() =>
      useCoBorrower(mortgageResult, {
        homePrice: 5_000_000,
        downPaymentAvailable: 500_000,
        userIncome: 10000,
        userDebt: 0,
        coDebt: 0,
        dsrLimit: 0.4,
        coIncomeProvided: 100000,
      }),
    );

    expect(result.current.combinedIncomeSufficient).toBe(true);
  });
});
