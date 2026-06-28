import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AddLineItemForm } from "../AddLineItemForm";

/**
 * Picks a month from a `MonthPicker` trigger: opens it, steps the year
 * forward `yearSteps` times, then clicks the Thai abbreviated month label.
 */
async function pickMonth(triggerLabel: RegExp | string, monthLabel: string, yearSteps = 0) {
  await userEvent.click(screen.getByLabelText(triggerLabel));
  const panel = screen.getByRole("dialog");
  for (let step = 0; step < yearSteps; step += 1) {
    await userEvent.click(within(panel).getByRole("button", { name: "ปีถัดไป" }));
  }
  await userEvent.click(within(panel).getByRole("button", { name: monthLabel }));
}

describe("AddLineItemForm", () => {
  it("submits a new income item with the entered label, amount, and effectiveFrom", async () => {
    const onAdd = vi.fn();
    render(<AddLineItemForm category="income" startMonth="2026-06" onAdd={onAdd} />);

    await userEvent.type(screen.getByLabelText("รายการ"), "เงินเดือนประจำ");
    await userEvent.clear(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"));
    await userEvent.type(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"), "35000");
    await userEvent.click(screen.getByRole("button", { name: "เพิ่มรายการ" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    const item = onAdd.mock.calls[0][0];
    expect(item.label).toBe("เงินเดือนประจำ");
    expect(item.category).toBe("income");
    expect(item.amountAt("2026-06")).toBe(35000);
    expect(item.endMonth).toBeUndefined();
  });

  it("does not show the endMonth field for non-debt categories", () => {
    render(<AddLineItemForm category="income" startMonth="2026-06" onAdd={vi.fn()} />);
    expect(screen.queryByLabelText(/ผ่อนหมดเดือน/)).not.toBeInTheDocument();
  });

  it("shows the endMonth field for debt and includes it on submit", async () => {
    const onAdd = vi.fn();
    render(<AddLineItemForm category="debt" startMonth="2026-06" onAdd={onAdd} />);

    await userEvent.type(screen.getByLabelText("รายการ"), "ผ่อนรถ");
    await userEvent.clear(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"));
    await userEvent.type(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"), "10000");

    // effectiveFrom defaults to 2026-06; step the endMonth picker to มี.ค. 2027.
    await pickMonth(/ผ่อนหมดเดือน/, "มี.ค.", 1);

    await userEvent.click(screen.getByRole("button", { name: "เพิ่มรายการ" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    const item = onAdd.mock.calls[0][0];
    expect(item.endMonth).toBe("2027-03");
  });

  // NOTE: these guard-clause tests use `fireEvent.submit(form)` rather than
  // `form.requestSubmit()` / clicking the submit button. `requestSubmit()`
  // enforces native HTML5 constraint validation (e.g. `required`, `min=0`)
  // and silently blocks the submit event entirely when the form is
  // `:invalid` — so it never reaches React's `onSubmit` handler, and the
  // component's own JS guard clause (`handleSubmit`'s `if` on line 38)
  // never runs. `fireEvent.submit` dispatches the submit event directly,
  // bypassing constraint validation, which is what's needed to actually
  // exercise the guard clause as a defense-in-depth check (e.g. for state
  // a user could reach despite the HTML attributes, or future changes that
  // relax them).
  it("does not call onAdd when the label is blank", async () => {
    const onAdd = vi.fn();
    const { container } = render(<AddLineItemForm category="income" startMonth="2026-06" onAdd={onAdd} />);

    await userEvent.clear(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"));
    await userEvent.type(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"), "1000");

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("treats a cleared/empty amount field as 0 and still submits (native type=number coerces non-numeric input to empty)", async () => {
    const onAdd = vi.fn();
    const { container } = render(<AddLineItemForm category="expense" startMonth="2026-06" onAdd={onAdd} />);

    await userEvent.type(screen.getByLabelText("รายการ"), "ของใช้");
    const amountInput = screen.getByLabelText("จำนวนเงิน (บาท/เดือน)") as HTMLInputElement;
    // A `type="number"` input cannot hold a literal non-numeric string —
    // the DOM itself coerces invalid keystrokes to an empty value, which
    // `Number("")` parses as 0 (finite, non-negative) rather than NaN. So
    // `!Number.isFinite(parsedAmount)` is unreachable through real user
    // interaction; this test documents the actual resulting behavior
    // instead of asserting an unreachable path.
    fireEvent.change(amountInput, { target: { value: "" } });

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0][0].amountAt("2026-06")).toBe(0);
  });

  it("does not call onAdd when effectiveFrom is empty", async () => {
    const onAdd = vi.fn();
    // With an empty startMonth the picker has no default value, so the user can
    // reach the form with a blank effectiveFrom — this exercises the guard.
    const { container } = render(<AddLineItemForm category="expense" startMonth="" onAdd={onAdd} />);

    await userEvent.type(screen.getByLabelText("รายการ"), "ของใช้");
    await userEvent.clear(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"));
    await userEvent.type(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"), "1000");

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("does not call onAdd when the amount is negative", async () => {
    const onAdd = vi.fn();
    const { container } = render(<AddLineItemForm category="expense" startMonth="2026-06" onAdd={onAdd} />);

    await userEvent.type(screen.getByLabelText("รายการ"), "ของใช้");
    const amountInput = screen.getByLabelText("จำนวนเงิน (บาท/เดือน)") as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: "-100" } });

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("submits the selected sub-category and effectiveFrom month", async () => {
    const onAdd = vi.fn();
    render(<AddLineItemForm category="expense" startMonth="2026-06" onAdd={onAdd} />);

    await userEvent.type(screen.getByLabelText("รายการ"), "ค่าเดินทาง");
    await userEvent.selectOptions(screen.getByLabelText("หมวดหมู่"), "transport");

    // startMonth is 2026-06; pick ส.ค. (August) of the same year.
    await pickMonth("เริ่มตั้งแต่เดือน", "ส.ค.");

    await userEvent.clear(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"));
    await userEvent.type(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"), "2000");
    await userEvent.click(screen.getByRole("button", { name: "เพิ่มรายการ" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    const item = onAdd.mock.calls[0][0];
    expect(item.subCategory).toBe("transport");
    expect(item.amountAt("2026-08")).toBe(2000);
    expect(item.amountAt("2026-07")).toBe(0);
  });

  it("resets the form fields after a successful submit", async () => {
    const onAdd = vi.fn();
    render(<AddLineItemForm category="income" startMonth="2026-06" onAdd={onAdd} />);

    const labelInput = screen.getByLabelText("รายการ") as HTMLInputElement;
    await userEvent.type(labelInput, "โบนัส");
    await userEvent.clear(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"));
    await userEvent.type(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"), "5000");
    await userEvent.click(screen.getByRole("button", { name: "เพิ่มรายการ" }));

    expect(labelInput.value).toBe("");
  });
});
