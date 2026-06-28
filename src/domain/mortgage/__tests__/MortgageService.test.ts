import { describe, expect, it } from "vitest";

import { LtvPolicy } from "../LtvPolicy";
import { LtvPolicyFactory } from "../LtvPolicyFactory";
import { MortgageInput, MortgageService } from "../MortgageService";

/** A fake LtvPolicy with a fixed LTV, for testing MortgageService without a real date. */
class FixedLtvPolicy implements LtvPolicy {
  readonly name = "fixed";
  constructor(private readonly ltv: number) {}
  maxLtv(): number {
    return this.ltv;
  }
}

function baseInput(overrides: Partial<MortgageInput> = {}): MortgageInput {
  return {
    homePrice: 4_000_000,
    homeOrder: 1,
    borrowerAge: 30,
    interestRatePercent: 6.5,
    loanTermYears: 30,
    downPaymentAvailable: 1_000_000,
    monthlyIncome: 50000,
    existingDebt: 0,
    dsrLimit: 0.4,
    ...overrides,
  };
}

describe("MortgageService", () => {
  it("LTV-bound scenario: generous DSR room but a low LTV cap binds first", () => {
    const service = new MortgageService(() => new FixedLtvPolicy(0.5));
    const result = service.evaluate(baseInput({ homePrice: 4_000_000, monthlyIncome: 200_000 }));

    expect(result.maxLoanByLtv).toBe(2_000_000);
    expect(result.bindingConstraint).toBe("ltv");
    expect(result.maxLoan).toBe(result.maxLoanByLtv);
  });

  it("DSR-bound scenario: high LTV cap but low income binds DSR first", () => {
    const service = new MortgageService(() => new FixedLtvPolicy(1.0));
    const result = service.evaluate(baseInput({ homePrice: 4_000_000, monthlyIncome: 15000, existingDebt: 2000 }));

    expect(result.bindingConstraint).toBe("dsr");
    expect(result.maxLoan).toBe(result.maxLoanByDsr);
    expect(result.maxLoanByDsr).toBeLessThan(result.maxLoanByLtv);
  });

  it("term cap: age 40, term 30 -> effective 30 (no clamp needed)", () => {
    const service = new MortgageService(() => new FixedLtvPolicy(1.0));
    const result = service.evaluate(baseInput({ borrowerAge: 40, loanTermYears: 30 }));
    expect(result.effectiveTermYears).toBe(30);
  });

  it("term cap: age 50, term 30 -> clamped to 20", () => {
    const service = new MortgageService(() => new FixedLtvPolicy(1.0));
    const result = service.evaluate(baseInput({ borrowerAge: 50, loanTermYears: 30 }));
    expect(result.effectiveTermYears).toBe(20);
  });

  it("term cap: age 55, term 30 -> clamped to 15", () => {
    const service = new MortgageService(() => new FixedLtvPolicy(1.0));
    const result = service.evaluate(baseInput({ borrowerAge: 55, loanTermYears: 30 }));
    expect(result.effectiveTermYears).toBe(15);
  });

  it("term cap: age 69, term 30 -> floored at 1 (not 1, would be negative without the floor)", () => {
    const service = new MortgageService(() => new FixedLtvPolicy(1.0));
    const result = service.evaluate(baseInput({ borrowerAge: 69, loanTermYears: 30 }));
    expect(result.effectiveTermYears).toBe(1);
  });

  it("canAffordTarget is true when affordable price and down payment both clear the target", () => {
    const service = new MortgageService(() => new FixedLtvPolicy(1.0));
    const result = service.evaluate(
      baseInput({ homePrice: 3_000_000, downPaymentAvailable: 1_000_000, monthlyIncome: 100000, existingDebt: 0 }),
    );
    expect(result.canAffordTarget).toBe(true);
  });

  it("canAffordTarget is false when DSR-limited income can't cover the target home", () => {
    const service = new MortgageService(() => new FixedLtvPolicy(1.0));
    const result = service.evaluate(
      baseInput({ homePrice: 10_000_000, downPaymentAvailable: 0, monthlyIncome: 20000, existingDebt: 0 }),
    );
    expect(result.canAffordTarget).toBe(false);
  });

  it("canAffordTarget is false when down payment is insufficient even if DSR/LTV would allow it", () => {
    const service = new MortgageService(() => new FixedLtvPolicy(0.5));
    const result = service.evaluate(
      baseInput({ homePrice: 4_000_000, downPaymentAvailable: 100_000, monthlyIncome: 500_000, existingDebt: 0 }),
    );
    // requiredDownPayment = 4,000,000 * 0.5 = 2,000,000, available is only 100,000
    expect(result.requiredDownPayment).toBe(2_000_000);
    expect(result.canAffordTarget).toBe(false);
  });

  it("dsrAfterLoan guards against zero/negative income", () => {
    const service = new MortgageService(() => new FixedLtvPolicy(1.0));
    const result = service.evaluate(baseInput({ monthlyIncome: 0 }));
    expect(result.dsrAfterLoan).toBe(0);
  });

  it("uses the default LtvPolicyFactory when no override is injected", () => {
    const service = new MortgageService();
    const result = service.evaluate(baseInput({ assessmentDate: new Date("2026-01-01") }));
    // Within the temporary relaxation window -> 100% LTV for a 1st home.
    expect(result.ltvPercent).toBe(1.0);
  });

  it("ltvPolicyName reflects the injected fake policy's name", () => {
    const service = new MortgageService(() => new FixedLtvPolicy(1.0));
    const result = service.evaluate(baseInput());
    expect(result.ltvPolicyName).toBe("fixed");
  });

  it("ltvPolicyName is 'temporary' for an assessment date on/before the relaxation end date (2027-06-30), using the real LtvPolicyFactory", () => {
    const service = new MortgageService(LtvPolicyFactory.forDate);
    const result = service.evaluate(baseInput({ assessmentDate: new Date("2027-06-30") }));
    expect(result.ltvPolicyName).toBe("temporary");
  });

  it("ltvPolicyName is 'normal' for an assessment date after the relaxation end date, using the real default LtvPolicyFactory (no override injected)", () => {
    const service = new MortgageService();
    const result = service.evaluate(baseInput({ assessmentDate: new Date("2027-07-01") }));
    expect(result.ltvPolicyName).toBe("normal");
  });
});
