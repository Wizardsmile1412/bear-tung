import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MonthPicker } from "../MonthPicker";

describe("MonthPicker", () => {
  it("shows the placeholder when no value is set", () => {
    render(<MonthPicker value="" onChange={vi.fn()} placeholder="เลือกเดือน" />);
    expect(screen.getByRole("button")).toHaveTextContent("เลือกเดือน");
  });

  it("shows the formatted Thai month + Gregorian year for the current value", () => {
    render(<MonthPicker value="2026-06" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /มิ\.ย\. 2026/ })).toBeInTheDocument();
  });

  it("opens the panel on trigger click and defaults the view to the value's year", async () => {
    render(<MonthPicker value="2026-06" onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /มิ\.ย\. 2026/ }));

    const panel = screen.getByRole("dialog");
    expect(within(panel).getByText("2026")).toBeInTheDocument();
  });

  it("calls onChange with the selected 'YYYY-MM' and closes the panel", async () => {
    const onChange = vi.fn();
    render(<MonthPicker value="2026-06" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /มิ\.ย\. 2026/ }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "ส.ค." }));

    expect(onChange).toHaveBeenCalledWith("2026-08");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("steps the year forward and back before selecting", async () => {
    const onChange = vi.fn();
    render(<MonthPicker value="2026-06" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /มิ\.ย\. 2026/ }));
    const panel = screen.getByRole("dialog");
    await userEvent.click(within(panel).getByRole("button", { name: "ปีถัดไป" }));
    await userEvent.click(within(panel).getByRole("button", { name: "ปีถัดไป" }));
    await userEvent.click(within(panel).getByRole("button", { name: "ปีก่อนหน้า" }));
    await userEvent.click(within(panel).getByRole("button", { name: "ก.พ." }));

    expect(onChange).toHaveBeenCalledWith("2027-02");
  });

  it("disables months earlier than `min` in the viewed year", async () => {
    render(<MonthPicker value="" onChange={vi.fn()} min="2026-06" />);

    await userEvent.click(screen.getByRole("button"));
    const panel = screen.getByRole("dialog");

    expect(within(panel).getByRole("button", { name: "ม.ค." })).toBeDisabled();
    expect(within(panel).getByRole("button", { name: "พ.ค." })).toBeDisabled();
    expect(within(panel).getByRole("button", { name: "มิ.ย." })).toBeEnabled();
  });

  it("marks the selected month as pressed", async () => {
    render(<MonthPicker value="2026-06" onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /มิ\.ย\. 2026/ }));
    const panel = screen.getByRole("dialog");

    expect(within(panel).getByRole("button", { name: "มิ.ย." })).toHaveAttribute("aria-pressed", "true");
    expect(within(panel).getByRole("button", { name: "ก.ค." })).toHaveAttribute("aria-pressed", "false");
  });

  it("clears the value when clearable and a value is set", async () => {
    const onChange = vi.fn();
    render(<MonthPicker value="2027-03" onChange={onChange} clearable />);

    await userEvent.click(screen.getByRole("button", { name: /มี\.ค\. 2027/ }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "ล้างกำหนด" }));

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("does not render the clear control when not clearable", async () => {
    render(<MonthPicker value="2027-03" onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /มี\.ค\. 2027/ }));

    expect(screen.queryByRole("button", { name: "ล้างกำหนด" })).not.toBeInTheDocument();
  });

  it("does not render the clear control when clearable but empty", async () => {
    render(<MonthPicker value="" onChange={vi.fn()} clearable />);

    await userEvent.click(screen.getByRole("button"));

    expect(screen.queryByRole("button", { name: "ล้างกำหนด" })).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    render(<MonthPicker value="2026-06" onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /มิ\.ย\. 2026/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on outside click", async () => {
    render(
      <div>
        <button type="button">ภายนอก</button>
        <MonthPicker value="2026-06" onChange={vi.fn()} />
      </div>,
    );

    await userEvent.click(screen.getByRole("button", { name: /มิ\.ย\. 2026/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "ภายนอก" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("re-syncs the viewed year to the value each time it reopens", async () => {
    render(<MonthPicker value="2026-06" onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /มิ\.ย\. 2026/ }));
    let panel = screen.getByRole("dialog");
    await userEvent.click(within(panel).getByRole("button", { name: "ปีถัดไป" }));
    expect(within(panel).getByText("2027")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: /มิ\.ย\. 2026/ }));

    panel = screen.getByRole("dialog");
    expect(within(panel).getByText("2026")).toBeInTheDocument();
  });
});
