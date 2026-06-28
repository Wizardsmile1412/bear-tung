import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ResetButton } from "../ResetButton";

describe("ResetButton", () => {
  it("renders the initial label and does not call onReset yet", () => {
    const onReset = vi.fn();
    render(<ResetButton onReset={onReset} />);

    expect(screen.getByRole("button", { name: "ล้างข้อมูลทั้งหมด" })).toBeInTheDocument();
    expect(onReset).not.toHaveBeenCalled();
  });

  it("shows an inline confirm step before calling onReset", async () => {
    const onReset = vi.fn();
    render(<ResetButton onReset={onReset} />);

    await userEvent.click(screen.getByRole("button", { name: "ล้างข้อมูลทั้งหมด" }));

    expect(onReset).not.toHaveBeenCalled();
    expect(screen.getByText("ยืนยันการล้างข้อมูลทั้งหมด?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ยืนยัน" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ยกเลิก" })).toBeInTheDocument();
  });

  it("calls onReset and collapses back when the confirm button is clicked", async () => {
    const onReset = vi.fn();
    render(<ResetButton onReset={onReset} />);

    await userEvent.click(screen.getByRole("button", { name: "ล้างข้อมูลทั้งหมด" }));
    await userEvent.click(screen.getByRole("button", { name: "ยืนยัน" }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "ล้างข้อมูลทั้งหมด" })).toBeInTheDocument();
  });

  it("does not call onReset and collapses back when cancelled", async () => {
    const onReset = vi.fn();
    render(<ResetButton onReset={onReset} />);

    await userEvent.click(screen.getByRole("button", { name: "ล้างข้อมูลทั้งหมด" }));
    await userEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));

    expect(onReset).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "ล้างข้อมูลทั้งหมด" })).toBeInTheDocument();
  });
});
