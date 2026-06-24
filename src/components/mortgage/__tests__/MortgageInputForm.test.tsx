import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MortgageInputForm } from "../MortgageInputForm";

function renderForm(overrides: Partial<React.ComponentProps<typeof MortgageInputForm>> = {}) {
  const props: React.ComponentProps<typeof MortgageInputForm> = {
    homePrice: 3_000_000,
    onHomePriceChange: vi.fn(),
    homeOrder: 1,
    onHomeOrderChange: vi.fn(),
    firstHomePaidAtLeastTwoYears: false,
    onFirstHomePaidAtLeastTwoYearsChange: vi.fn(),
    borrowerAge: 30,
    onBorrowerAgeChange: vi.fn(),
    downPaymentAvailable: 500_000,
    onDownPaymentAvailableChange: vi.fn(),
    ...overrides,
  };
  render(<MortgageInputForm {...props} />);
  return props;
}

describe("MortgageInputForm", () => {
  it("renders the current values", () => {
    renderForm();
    expect(screen.getByLabelText("ราคาบ้านที่ต้องการ")).toHaveValue(3_000_000);
    expect(screen.getByLabelText("อายุผู้กู้")).toHaveValue(30);
    expect(screen.getByLabelText("เงินดาวน์ที่มี")).toHaveValue(500_000);
  });

  it("fires onHomePriceChange when the home price input changes", () => {
    const props = renderForm();
    const input = screen.getByLabelText("ราคาบ้านที่ต้องการ");
    fireEvent.change(input, { target: { value: "5" } });
    expect(props.onHomePriceChange).toHaveBeenLastCalledWith(5);
  });

  it("fires onBorrowerAgeChange when the age input changes", () => {
    const props = renderForm();
    const input = screen.getByLabelText("อายุผู้กู้");
    fireEvent.change(input, { target: { value: "4" } });
    expect(props.onBorrowerAgeChange).toHaveBeenLastCalledWith(4);
  });

  it("fires onDownPaymentAvailableChange when the down payment input changes", () => {
    const props = renderForm();
    const input = screen.getByLabelText("เงินดาวน์ที่มี");
    fireEvent.change(input, { target: { value: "9" } });
    expect(props.onDownPaymentAvailableChange).toHaveBeenLastCalledWith(9);
  });

  it("does not render the 'firstHomePaidAtLeastTwoYears' checkbox when homeOrder is 1", () => {
    renderForm({ homeOrder: 1 });
    expect(screen.queryByLabelText("ผ่อนบ้านหลังแรกมาแล้วอย่างน้อย 2 ปี")).not.toBeInTheDocument();
  });

  it("renders the 'firstHomePaidAtLeastTwoYears' checkbox only when homeOrder is 2", async () => {
    const props = renderForm({ homeOrder: 2, firstHomePaidAtLeastTwoYears: false });
    const checkbox = screen.getByLabelText("ผ่อนบ้านหลังแรกมาแล้วอย่างน้อย 2 ปี");
    expect(checkbox).toBeInTheDocument();

    await userEvent.click(checkbox);
    expect(props.onFirstHomePaidAtLeastTwoYearsChange).toHaveBeenCalledWith(true);
  });

  it("does not render the checkbox when homeOrder is 3", () => {
    renderForm({ homeOrder: 3 });
    expect(screen.queryByLabelText("ผ่อนบ้านหลังแรกมาแล้วอย่างน้อย 2 ปี")).not.toBeInTheDocument();
  });

  it("fires onHomeOrderChange with a numeric value when the select changes", async () => {
    const props = renderForm({ homeOrder: 1 });
    const select = screen.getByLabelText("บ้านหลังนี้เป็นหลังที่");
    await userEvent.selectOptions(select, "บ้านหลังที่ 2");
    expect(props.onHomeOrderChange).toHaveBeenCalledWith(2);
  });

  it("falls back to 0 when the home price input resolves to a finite negative number", () => {
    const props = renderForm();
    const input = screen.getByLabelText("ราคาบ้านที่ต้องการ");
    fireEvent.change(input, { target: { value: "-1" } });
    expect(props.onHomePriceChange).toHaveBeenLastCalledWith(0);
  });

  it("falls back to 0 when the borrower age input resolves to a finite negative number", () => {
    const props = renderForm();
    const input = screen.getByLabelText("อายุผู้กู้");
    fireEvent.change(input, { target: { value: "-1" } });
    expect(props.onBorrowerAgeChange).toHaveBeenLastCalledWith(0);
  });

  it("falls back to 0 when the down payment input resolves to a finite negative number", () => {
    const props = renderForm();
    const input = screen.getByLabelText("เงินดาวน์ที่มี");
    fireEvent.change(input, { target: { value: "-1" } });
    expect(props.onDownPaymentAvailableChange).toHaveBeenLastCalledWith(0);
  });
});
