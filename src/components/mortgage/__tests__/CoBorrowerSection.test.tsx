import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CoBorrowerResult } from "@/domain/mortgage/CoBorrowerService";

import { CoBorrowerSection } from "../CoBorrowerSection";

function renderSection(overrides: Partial<React.ComponentProps<typeof CoBorrowerSection>> = {}) {
  const props: React.ComponentProps<typeof CoBorrowerSection> = {
    enabled: false,
    onEnabledChange: vi.fn(),
    coDebt: 0,
    onCoDebtChange: vi.fn(),
    coIncomeProvided: undefined,
    onCoIncomeProvidedChange: vi.fn(),
    result: null,
    ...overrides,
  };
  render(<CoBorrowerSection {...props} />);
  return props;
}

describe("CoBorrowerSection", () => {
  it("hides the rest of the section when not enabled", () => {
    renderSection({ enabled: false });
    expect(screen.queryByLabelText("หนี้ปัจจุบันของผู้กู้ร่วม")).not.toBeInTheDocument();
  });

  it("fires onEnabledChange when the checkbox is toggled", async () => {
    const props = renderSection({ enabled: false });
    await userEvent.click(screen.getByLabelText("ต้องการเพิ่มผู้กู้ร่วม"));
    expect(props.onEnabledChange).toHaveBeenCalledWith(true);
  });

  it("shows the coDebt and coIncomeProvided inputs when enabled", () => {
    renderSection({ enabled: true });
    expect(screen.getByLabelText("หนี้ปัจจุบันของผู้กู้ร่วม")).toBeInTheDocument();
    expect(screen.getByLabelText("รายได้ของผู้กู้ร่วม (ถ้ามี)")).toBeInTheDocument();
  });

  it("fires onCoDebtChange when the co-debt input changes", async () => {
    const props = renderSection({ enabled: true });
    const input = screen.getByLabelText("หนี้ปัจจุบันของผู้กู้ร่วม");
    await userEvent.clear(input);
    await userEvent.type(input, "3");
    expect(props.onCoDebtChange).toHaveBeenLastCalledWith(3);
  });

  it("falls back to 0 when the co-debt input resolves to a finite negative number", () => {
    const props = renderSection({ enabled: true });
    const input = screen.getByLabelText("หนี้ปัจจุบันของผู้กู้ร่วม");
    fireEvent.change(input, { target: { value: "-1" } });
    expect(props.onCoDebtChange).toHaveBeenLastCalledWith(0);
  });

  it("leaves coIncomeProvided as undefined (not 0) when the income input is blank", () => {
    renderSection({ enabled: true, coIncomeProvided: undefined });
    const input = screen.getByLabelText("รายได้ของผู้กู้ร่วม (ถ้ามี)");
    expect(input).toHaveValue(null);
  });

  it("fires onCoIncomeProvidedChange(undefined) when the income input is cleared", async () => {
    const props = renderSection({ enabled: true, coIncomeProvided: 20000 });
    const input = screen.getByLabelText("รายได้ของผู้กู้ร่วม (ถ้ามี)");
    await userEvent.clear(input);
    expect(props.onCoIncomeProvidedChange).toHaveBeenLastCalledWith(undefined);
  });

  it("falls back to 0 when the co-income input resolves to a finite negative number (typed, not blank)", () => {
    const props = renderSection({ enabled: true, coIncomeProvided: 20000 });
    const input = screen.getByLabelText("รายได้ของผู้กู้ร่วม (ถ้ามี)");
    fireEvent.change(input, { target: { value: "-1" } });
    expect(props.onCoIncomeProvidedChange).toHaveBeenLastCalledWith(0);
  });

  it("fires onCoIncomeProvidedChange with the typed value for a valid non-negative number", () => {
    const props = renderSection({ enabled: true, coIncomeProvided: undefined });
    const input = screen.getByLabelText("รายได้ของผู้กู้ร่วม (ถ้ามี)");
    fireEvent.change(input, { target: { value: "32405" } });
    expect(props.onCoIncomeProvidedChange).toHaveBeenLastCalledWith(32405);
  });

  it("shows the LTV-bound warning message distinctly when isLtvBound is true", () => {
    const result: CoBorrowerResult = { isLtvBound: true, alreadyQualifies: false, requiredCoIncome: 0 };
    renderSection({ enabled: true, result });
    expect(
      screen.getByText(
        "ผู้กู้ร่วมไม่สามารถช่วยได้ในกรณีนี้ เนื่องจากเงินดาวน์ไม่เพียงพอตามเกณฑ์ LTV ลองเพิ่มเงินดาวน์ หรือเลือกบ้านราคาที่ต่ำลง",
      ),
    ).toBeInTheDocument();
  });

  it("shows the already-qualifies message when alreadyQualifies is true", () => {
    const result: CoBorrowerResult = { isLtvBound: false, alreadyQualifies: true, requiredCoIncome: 0 };
    renderSection({ enabled: true, result });
    expect(screen.getByText("คุณมีคุณสมบัติเพียงพอแล้ว ไม่จำเป็นต้องมีผู้กู้ร่วม")).toBeInTheDocument();
  });

  it("shows the required co-income message otherwise", () => {
    const result: CoBorrowerResult = { isLtvBound: false, alreadyQualifies: false, requiredCoIncome: 15000 };
    renderSection({ enabled: true, result });
    expect(screen.getByText("ผู้กู้ร่วมควรมีรายได้อย่างน้อย 15,000 บาท/เดือน เพื่อให้กู้ผ่าน")).toBeInTheDocument();
  });

  it("shows the combined-income-sufficient message when combinedIncomeSufficient is true", () => {
    const result: CoBorrowerResult = {
      isLtvBound: false,
      alreadyQualifies: false,
      requiredCoIncome: 15000,
      combinedIncomeSufficient: true,
    };
    renderSection({ enabled: true, result });
    expect(screen.getByText("รายได้รวมของคุณและผู้กู้ร่วมเพียงพอแล้ว")).toBeInTheDocument();
  });

  it("shows the combined-income-insufficient message when combinedIncomeSufficient is false", () => {
    const result: CoBorrowerResult = {
      isLtvBound: false,
      alreadyQualifies: false,
      requiredCoIncome: 15000,
      combinedIncomeSufficient: false,
    };
    renderSection({ enabled: true, result });
    expect(screen.getByText("รายได้รวมยังไม่เพียงพอ")).toBeInTheDocument();
  });

  it("does not show any combined-income message when combinedIncomeSufficient is undefined", () => {
    const result: CoBorrowerResult = { isLtvBound: false, alreadyQualifies: false, requiredCoIncome: 15000 };
    renderSection({ enabled: true, result });
    expect(screen.queryByText("รายได้รวมของคุณและผู้กู้ร่วมเพียงพอแล้ว")).not.toBeInTheDocument();
    expect(screen.queryByText("รายได้รวมยังไม่เพียงพอ")).not.toBeInTheDocument();
  });
});
