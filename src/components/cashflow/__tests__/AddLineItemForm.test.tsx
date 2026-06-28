import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LineItem } from "@/domain/model/LineItem";

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

  it("defaults the label to the selected หมวดหมู่ name when left blank (รายการ is optional)", async () => {
    const onAdd = vi.fn();
    render(<AddLineItemForm category="income" startMonth="2026-06" onAdd={onAdd} />);

    // Leave รายการ blank; default income sub-category is "salary" (เงินเดือน).
    await userEvent.clear(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"));
    await userEvent.type(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"), "1000");
    await userEvent.click(screen.getByRole("button", { name: "เพิ่มรายการ" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0][0].label).toBe("เงินเดือน");
  });

  // NOTE: these guard-clause tests use `fireEvent.submit(form)` rather than
  // `form.requestSubmit()` / clicking the submit button. `requestSubmit()`
  // enforces native HTML5 constraint validation (e.g. `required`, `min=0`)
  // and silently blocks the submit event entirely when the form is
  // `:invalid` — so it never reaches React's `onSubmit` handler, and the
  // component's own JS guard clause (`handleSubmit`'s `if (!effectiveFrom)`)
  // never runs. `fireEvent.submit` dispatches the submit event directly,
  // bypassing constraint validation, which is what's needed to actually
  // exercise the guard clause as a defense-in-depth check (e.g. for state
  // a user could reach despite the HTML attributes, or future changes that
  // relax them).
  it("treats a cleared/empty amount field as 0 and still submits", async () => {
    const onAdd = vi.fn();
    const { container } = render(<AddLineItemForm category="expense" startMonth="2026-06" onAdd={onAdd} />);

    await userEvent.type(screen.getByLabelText("รายการ"), "ของใช้");
    const amountInput = screen.getByLabelText("จำนวนเงิน (บาท/เดือน)") as HTMLInputElement;
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

  it("ignores a negative amount keystroke (NumericField only accepts digits)", async () => {
    const onAdd = vi.fn();
    render(<AddLineItemForm category="expense" startMonth="2026-06" onAdd={onAdd} />);

    const amountInput = screen.getByLabelText("จำนวนเงิน (บาท/เดือน)") as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: "-100" } });

    expect(amountInput.value).toBe("");
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

  it("pre-fills every field from initialItem and shows the 'บันทึก' + 'ยกเลิก' buttons", () => {
    const item = LineItem.create({
      id: "debt-1",
      category: "debt",
      subCategory: "car",
      label: "ผ่อนรถยนต์",
      changes: [{ effectiveFrom: "2026-06", amount: 8000 }],
      endMonth: "2030-06",
    });

    render(
      <AddLineItemForm category="debt" startMonth="2026-01" onAdd={vi.fn()} initialItem={item} onCancel={vi.fn()} />,
    );

    expect((screen.getByLabelText("รายการ") as HTMLInputElement).value).toBe("ผ่อนรถยนต์");
    expect((screen.getByLabelText("จำนวนเงิน (บาท/เดือน)") as HTMLInputElement).value).toBe("8000");
    expect(screen.getByLabelText(/เริ่มตั้งแต่เดือน/)).toHaveTextContent("มิ.ย. 2026");
    expect(screen.getByLabelText(/ผ่อนหมดเดือน/)).toHaveTextContent("มิ.ย. 2030");
    expect(screen.getByRole("button", { name: "บันทึก" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ยกเลิก" })).toBeInTheDocument();
  });

  it("submits the edited item with the same id (does not create a new one)", async () => {
    const onAdd = vi.fn();
    const item = LineItem.create({
      id: "income-1",
      category: "income",
      subCategory: "salary",
      label: "เงินเดือนประจำ",
      changes: [{ effectiveFrom: "2026-06", amount: 35000 }],
    });

    render(<AddLineItemForm category="income" startMonth="2026-06" onAdd={onAdd} initialItem={item} />);

    await userEvent.clear(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"));
    await userEvent.type(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"), "40000");
    await userEvent.click(screen.getByRole("button", { name: "บันทึก" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    const updated = onAdd.mock.calls[0][0];
    expect(updated.id).toBe("income-1");
    expect(updated.amountAt("2026-06")).toBe(40000);
  });

  it("calls onCancel and does not call onAdd when cancelled", async () => {
    const onAdd = vi.fn();
    const onCancel = vi.fn();
    const item = LineItem.create({
      id: "income-1",
      category: "income",
      subCategory: "salary",
      label: "เงินเดือนประจำ",
      changes: [{ effectiveFrom: "2026-06", amount: 35000 }],
    });

    render(<AddLineItemForm category="income" startMonth="2026-06" onAdd={onAdd} initialItem={item} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onAdd).not.toHaveBeenCalled();
  });
});
