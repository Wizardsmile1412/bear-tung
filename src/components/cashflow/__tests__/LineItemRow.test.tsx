import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LineItem } from "@/domain/model/LineItem";

import { LineItemRow } from "../LineItemRow";

function makeItem() {
  return LineItem.create({
    id: "income-1",
    category: "income",
    subCategory: "salary",
    label: "เงินเดือนประจำ",
    changes: [{ effectiveFrom: "2026-06", amount: 35000 }],
  });
}

function renderRow(overrides: Partial<Parameters<typeof LineItemRow>[0]> = {}) {
  return render(
    <LineItemRow
      item={makeItem()}
      amount={35000}
      category="income"
      startMonth="2026-06"
      onDelete={vi.fn()}
      onUpdate={vi.fn()}
      {...overrides}
    />,
  );
}

describe("LineItemRow", () => {
  it("renders the label, sub-category, and formatted amount", () => {
    renderRow();

    expect(screen.getByText("เงินเดือนประจำ")).toBeInTheDocument();
    expect(screen.getByText("เงินเดือน")).toBeInTheDocument();
    expect(screen.getByText("35,000 บาท")).toBeInTheDocument();
  });

  it("calls onDelete with the item id when the delete button is clicked", async () => {
    const onDelete = vi.fn();
    renderRow({ onDelete });

    await userEvent.click(screen.getByRole("button", { name: "ลบ เงินเดือนประจำ" }));

    expect(onDelete).toHaveBeenCalledWith("income-1");
  });

  it("shows the formatted end month for a debt item that has one", () => {
    const item = LineItem.create({
      id: "debt-1",
      category: "debt",
      subCategory: "car",
      label: "ผ่อนรถยนต์",
      changes: [{ effectiveFrom: "2026-06", amount: 8000 }],
      endMonth: "2030-06",
    });

    renderRow({ item, amount: 8000, category: "debt" });

    expect(screen.getByText("ผ่อนหมดเดือน มิ.ย. 2030")).toBeInTheDocument();
  });

  it("does not show an end month detail for an item without one", () => {
    renderRow();

    expect(screen.queryByText(/ผ่อนหมดเดือน/)).not.toBeInTheDocument();
  });

  it("shows a pre-filled edit form in place of the row when แก้ไข is clicked", async () => {
    renderRow();

    await userEvent.click(screen.getByRole("button", { name: "แก้ไข เงินเดือนประจำ" }));

    expect((screen.getByLabelText("รายการ") as HTMLInputElement).value).toBe("เงินเดือนประจำ");
    expect((screen.getByLabelText("จำนวนเงิน (บาท/เดือน)") as HTMLInputElement).value).toBe("35000");
    expect(screen.getByRole("button", { name: "บันทึก" })).toBeInTheDocument();
  });

  it("calls onUpdate with the item id and the edited item, then collapses back to the normal row", async () => {
    const onUpdate = vi.fn();
    renderRow({ onUpdate });

    await userEvent.click(screen.getByRole("button", { name: "แก้ไข เงินเดือนประจำ" }));
    await userEvent.clear(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"));
    await userEvent.type(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"), "40000");
    await userEvent.click(screen.getByRole("button", { name: "บันทึก" }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const [id, updated] = onUpdate.mock.calls[0];
    expect(id).toBe("income-1");
    expect(updated.amountAt("2026-06")).toBe(40000);
    expect(screen.getByRole("button", { name: "แก้ไข เงินเดือนประจำ" })).toBeInTheDocument();
  });

  it("cancels the edit without calling onUpdate", async () => {
    const onUpdate = vi.fn();
    renderRow({ onUpdate });

    await userEvent.click(screen.getByRole("button", { name: "แก้ไข เงินเดือนประจำ" }));
    await userEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));

    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "แก้ไข เงินเดือนประจำ" })).toBeInTheDocument();
  });
});
