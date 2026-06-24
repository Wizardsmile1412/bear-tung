import { describe, expect, it } from "vitest";

import { AmortizationCalculator } from "../AmortizationCalculator";

describe("AmortizationCalculator", () => {
  it("monthlyRate converts an annual percent rate to a monthly decimal rate", () => {
    expect(AmortizationCalculator.monthlyRate(6.5)).toBeCloseTo(6.5 / 12 / 100, 10);
    expect(AmortizationCalculator.monthlyRate(0)).toBe(0);
  });

  it("payment: 3,000,000 @ 6.5%/30y matches the worked example (~18,962)", () => {
    const r = AmortizationCalculator.monthlyRate(6.5);
    const payment = AmortizationCalculator.payment(3_000_000, r, 360);
    expect(payment).toBeCloseTo(18962, 0);
  });

  it("payment: zero-interest case is a flat principal/n split", () => {
    const payment = AmortizationCalculator.payment(1_200_000, 0, 120);
    expect(payment).toBe(10000);
  });

  it("payment: degenerate numPayments <= 0 returns principal without throwing", () => {
    expect(() => AmortizationCalculator.payment(100000, 0.005, 0)).not.toThrow();
    expect(AmortizationCalculator.payment(100000, 0.005, 0)).toBe(100000);
    expect(AmortizationCalculator.payment(100000, 0.005, -5)).toBe(100000);
  });

  it("maxLoanFromPayment round-trips back to roughly the original principal", () => {
    const r = AmortizationCalculator.monthlyRate(6.5);
    const n = 360;
    const principal = 3_000_000;
    const payment = AmortizationCalculator.payment(principal, r, n);
    const recovered = AmortizationCalculator.maxLoanFromPayment(payment, r, n);
    expect(recovered).toBeCloseTo(principal, 0);
  });

  it("maxLoanFromPayment: zero-interest case is payment * n", () => {
    expect(AmortizationCalculator.maxLoanFromPayment(10000, 0, 120)).toBe(1_200_000);
  });

  it("maxLoanFromPayment: payment <= 0 returns 0", () => {
    expect(AmortizationCalculator.maxLoanFromPayment(0, 0.005, 360)).toBe(0);
    expect(AmortizationCalculator.maxLoanFromPayment(-100, 0.005, 360)).toBe(0);
  });
});
