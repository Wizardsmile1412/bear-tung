import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AssumptionPanel } from "../AssumptionPanel";

function renderPanel(overrides: Partial<React.ComponentProps<typeof AssumptionPanel>> = {}) {
  const props: React.ComponentProps<typeof AssumptionPanel> = {
    interestRatePercent: 6.5,
    onInterestRatePercentChange: vi.fn(),
    loanTermYears: 30,
    onLoanTermYearsChange: vi.fn(),
    ltvPolicyName: "temporary",
    ...overrides,
  };
  render(<AssumptionPanel {...props} />);
  return props;
}

describe("AssumptionPanel", () => {
  it("renders the current values", () => {
    renderPanel();
    expect(screen.getByLabelText("อัตราดอกเบี้ย")).toHaveValue("6.5");
    expect(screen.getByLabelText("ระยะเวลากู้")).toHaveValue("30");
    expect(screen.getByLabelText("DSR สูงสุดที่รับได้")).toHaveValue("40");
  });

  it("fires onInterestRatePercentChange when the rate input changes", () => {
    const props = renderPanel();
    const input = screen.getByLabelText("อัตราดอกเบี้ย");
    fireEvent.change(input, { target: { value: "7" } });
    expect(props.onInterestRatePercentChange).toHaveBeenLastCalledWith(7);
  });

  it("fires onLoanTermYearsChange when the term input changes", () => {
    const props = renderPanel();
    const input = screen.getByLabelText("ระยะเวลากู้");
    fireEvent.change(input, { target: { value: "20" } });
    expect(props.onLoanTermYearsChange).toHaveBeenLastCalledWith(20);
  });

  it("shows the DSR cap as a fixed, disabled field that cannot be edited", () => {
    renderPanel();
    const input = screen.getByLabelText("DSR สูงสุดที่รับได้");
    expect(input).toBeDisabled();
    expect(input).toHaveValue("40");

    fireEvent.change(input, { target: { value: "50" } });
    expect(input).toHaveValue("40");
  });

  it("shows the temporary-relaxation LTV badge text when ltvPolicyName is 'temporary'", () => {
    renderPanel({ ltvPolicyName: "temporary" });
    expect(screen.getByText("เกณฑ์ LTV ผ่อนปรน — กู้ได้สูงสุด 100% ถึง 30 มิ.ย. 2027")).toBeInTheDocument();
  });

  it("shows the normal-rules LTV badge text when ltvPolicyName is 'normal'", () => {
    renderPanel({ ltvPolicyName: "normal" });
    expect(screen.getByText("เกณฑ์ LTV ปกติ — ตามจำนวนบ้านและราคาบ้าน")).toBeInTheDocument();
  });

  it("shows a neutral 'not yet evaluated' message when ltvPolicyName is '' (no real result yet) instead of defaulting to the 'normal' wording", () => {
    renderPanel({ ltvPolicyName: "" });
    expect(screen.getByText("ยังไม่ทราบเกณฑ์ LTV — กรอกข้อมูลด้านบนเพื่อดูผลประเมิน")).toBeInTheDocument();
    expect(screen.queryByText("เกณฑ์ LTV ปกติ — ตามจำนวนบ้านและราคาบ้าน")).not.toBeInTheDocument();
    expect(screen.queryByText("เกณฑ์ LTV ผ่อนปรน — กู้ได้สูงสุด 100% ถึง 30 มิ.ย. 2027")).not.toBeInTheDocument();
  });

  it("ignores a negative interest rate keystroke (NumericField only accepts digits)", () => {
    const props = renderPanel();
    const input = screen.getByLabelText("อัตราดอกเบี้ย");
    fireEvent.change(input, { target: { value: "-1" } });
    expect(props.onInterestRatePercentChange).not.toHaveBeenCalled();
  });

  it("ignores a negative loan term keystroke (NumericField only accepts digits)", () => {
    const props = renderPanel();
    const input = screen.getByLabelText("ระยะเวลากู้");
    fireEvent.change(input, { target: { value: "-1" } });
    expect(props.onLoanTermYearsChange).not.toHaveBeenCalled();
  });

  describe("InfoTooltip wiring", () => {
    it("renders 4 info tooltips: interest rate, loan term, DSR limit, and the LTV badge", () => {
      renderPanel();
      expect(screen.getAllByRole("button", { name: "ดูคำอธิบาย" })).toHaveLength(4);
    });

    it("reveals the interest-rate explanation when its tooltip is toggled", async () => {
      renderPanel();
      const buttons = screen.getAllByRole("button", { name: "ดูคำอธิบาย" });
      await userEvent.click(buttons[0]);
      expect(screen.getByText(/อัตราดอกเบี้ยที่ธนาคารคิดต่อปี/)).toBeInTheDocument();
    });

    it("reveals the LTV explanation when the badge's tooltip is toggled", async () => {
      renderPanel();
      const buttons = screen.getAllByRole("button", { name: "ดูคำอธิบาย" });
      await userEvent.click(buttons[3]);
      expect(screen.getByText(/LTV \(Loan-to-Value\) คือสัดส่วนเงินกู้ต่อราคาบ้าน/)).toBeInTheDocument();
    });
  });
});
