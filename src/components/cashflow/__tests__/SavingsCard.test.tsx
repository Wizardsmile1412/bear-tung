import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SavingsCard } from "../SavingsCard";

describe("SavingsCard", () => {
  it("shows the current savings value (formatted) in read-only mode", () => {
    render(<SavingsCard savings={50000} onChange={vi.fn()} />);

    expect(screen.getByText("50,000 บาท")).toBeInTheDocument();
    // The editable field is hidden until the user opts to edit.
    expect(screen.queryByLabelText("เงินออม/เงินสดที่มีอยู่ตอนนี้")).not.toBeInTheDocument();
  });

  it("reveals the input only after clicking แก้ไข", async () => {
    render(<SavingsCard savings={1000} onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "แก้ไข" }));

    expect(screen.getByLabelText("เงินออม/เงินสดที่มีอยู่ตอนนี้")).toHaveValue("1000");
  });

  it("does not call onChange while typing — only on บันทึก (save)", async () => {
    const onChange = vi.fn();
    render(<SavingsCard savings={0} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "แก้ไข" }));
    await userEvent.type(screen.getByLabelText("เงินออม/เงินสดที่มีอยู่ตอนนี้"), "5000");
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "บันทึก" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(5000);
  });

  it("discards the edit on ยกเลิก (cancel) and keeps the original value", async () => {
    const onChange = vi.fn();
    render(<SavingsCard savings={1000} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "แก้ไข" }));
    const input = screen.getByLabelText("เงินออม/เงินสดที่มีอยู่ตอนนี้");
    await userEvent.clear(input);
    await userEvent.type(input, "2000");
    await userEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("1,000 บาท")).toBeInTheDocument();
  });

  it("ignores a negative keystroke (NumericField only accepts digits)", async () => {
    const onChange = vi.fn();
    render(<SavingsCard savings={5} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "แก้ไข" }));
    const input = screen.getByLabelText("เงินออม/เงินสดที่มีอยู่ตอนนี้");
    fireEvent.change(input, { target: { value: "-100" } });

    // The "-100" is rejected, so the draft is unchanged; saving keeps the original.
    await userEvent.click(screen.getByRole("button", { name: "บันทึก" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(5);
  });
});
