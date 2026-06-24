import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SavingsCard } from "../SavingsCard";

describe("SavingsCard", () => {
  it("renders the current savings value", () => {
    render(<SavingsCard savings={50000} onChange={vi.fn()} />);
    expect(screen.getByLabelText("เงินออม/เงินสดที่มีอยู่ตอนนี้")).toHaveValue(50000);
  });

  it("calls onChange with the parsed numeric value on input", async () => {
    const onChange = vi.fn();
    render(<SavingsCard savings={0} onChange={onChange} />);

    const input = screen.getByLabelText("เงินออม/เงินสดที่มีอยู่ตอนนี้");
    await userEvent.clear(input);
    await userEvent.type(input, "5");

    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it("falls back to 0 when the input is cleared to an empty (NaN) value", () => {
    const onChange = vi.fn();
    render(<SavingsCard savings={5} onChange={onChange} />);

    const input = screen.getByLabelText("เงินออม/เงินสดที่มีอยู่ตอนนี้");
    fireEvent.change(input, { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("falls back to 0 when the input resolves to a finite negative number", () => {
    const onChange = vi.fn();
    render(<SavingsCard savings={5} onChange={onChange} />);

    const input = screen.getByLabelText("เงินออม/เงินสดที่มีอยู่ตอนนี้");
    fireEvent.change(input, { target: { value: "-100" } });

    expect(onChange).toHaveBeenCalledWith(0);
  });
});
