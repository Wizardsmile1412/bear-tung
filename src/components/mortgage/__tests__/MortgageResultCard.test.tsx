import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MortgageResult } from "@/domain/mortgage/MortgageService";

import { MortgageResultCard } from "../MortgageResultCard";

function baseResult(overrides: Partial<MortgageResult> = {}): MortgageResult {
  return {
    maxLoan: 2_500_000,
    maxLoanByLtv: 3_000_000,
    maxLoanByDsr: 2_500_000,
    bindingConstraint: "dsr",
    ltvPercent: 1.0,
    requiredDownPayment: 0,
    affordableHomePrice: 2_500_000,
    canAffordTarget: true,
    monthlyPayment: 18962,
    dsrAfterLoan: 0.38,
    effectiveTermYears: 30,
    monthlyRate: 0.00542,
    numPayments: 360,
    ltvPolicyName: "temporary",
    ...overrides,
  };
}

describe("MortgageResultCard", () => {
  it("shows the affordable badge and key figures when canAffordTarget is true", () => {
    const result = baseResult({ canAffordTarget: true });
    render(<MortgageResultCard result={result} downPaymentAvailable={0} />);

    expect(screen.getByText("สามารถซื้อบ้านราคานี้ได้")).toBeInTheDocument();
    expect(screen.getByText("2,500,000 บาท", { exact: false })).toBeInTheDocument();
  });

  it("shows the non-affordable badge with non-judgmental phrasing when canAffordTarget is false", () => {
    const result = baseResult({ canAffordTarget: false });
    render(<MortgageResultCard result={result} downPaymentAvailable={0} />);

    expect(screen.getByText("ยังไม่สามารถซื้อบ้านราคานี้ได้ในตอนนี้")).toBeInTheDocument();
    expect(screen.queryByText(/แย่/)).not.toBeInTheDocument();
  });

  it("shows the DSR-after-loan percentage rounded", () => {
    const result = baseResult({ dsrAfterLoan: 0.375 });
    render(<MortgageResultCard result={result} downPaymentAvailable={0} />);
    expect(screen.getByText("DSR หลังกู้ 38%", { exact: false })).toBeInTheDocument();
  });

  it("shows the LTV binding constraint message", () => {
    const result = baseResult({ bindingConstraint: "ltv" });
    render(<MortgageResultCard result={result} downPaymentAvailable={0} />);
    expect(screen.getByText("ติดเงื่อนไข: เงินดาวน์ (LTV)")).toBeInTheDocument();
  });

  it("shows the DSR binding constraint message with the fixed DSR cap", () => {
    const result = baseResult({ bindingConstraint: "dsr" });
    render(<MortgageResultCard result={result} downPaymentAvailable={0} />);
    expect(
      screen.getByText("ติดเงื่อนไข: ภาระหนี้ต่อรายได้ (DSR), ต้องไม่เกิน 40% ของรายได้ (รวมหนี้เดิมที่มีอยู่แล้วด้วย)"),
    ).toBeInTheDocument();
  });

  it("shows a sufficient-down-payment indicator when available >= required", () => {
    const result = baseResult({ requiredDownPayment: 100_000 });
    render(<MortgageResultCard result={result} downPaymentAvailable={200_000} />);
    expect(screen.getByText("เงินดาวน์เพียงพอ")).toBeInTheDocument();
  });

  it("shows an insufficient-down-payment indicator when available < required", () => {
    const result = baseResult({ requiredDownPayment: 500_000 });
    render(<MortgageResultCard result={result} downPaymentAvailable={100_000} />);
    expect(screen.getByText("เงินดาวน์ไม่พอ")).toBeInTheDocument();
  });

  it("always shows the educational disclaimer", () => {
    render(<MortgageResultCard result={baseResult()} downPaymentAvailable={0} />);
    expect(screen.getByText("เป็นการประมาณการเพื่อการศึกษา ไม่ใช่การอนุมัติจากธนาคาร")).toBeInTheDocument();
  });

  it("reveals an LTV-vs-DSR explanation when the binding-constraint tooltip is toggled", async () => {
    render(<MortgageResultCard result={baseResult()} downPaymentAvailable={0} />);

    const tooltipButton = screen.getByRole("button", { name: "ดูคำอธิบาย" });
    await userEvent.click(tooltipButton);

    expect(screen.getByText(/ธนาคารตรวจสอบ 2 เงื่อนไขหลัก/)).toBeInTheDocument();
  });
});
