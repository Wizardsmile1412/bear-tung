import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LineItem } from "@/domain/model/LineItem";

import { CategoryGroupCard } from "../CategoryGroupCard";

function makeItem(id: string, amount: number) {
  return LineItem.create({
    id,
    category: "income",
    subCategory: "salary",
    label: `Item ${id}`,
    changes: [{ effectiveFrom: "2026-06", amount }],
  });
}

describe("CategoryGroupCard", () => {
  it("shows the empty-category message and zero subtotal when there are no items", () => {
    render(
      <CategoryGroupCard
        category="income"
        items={[]}
        month="2026-06"
        startMonth="2026-06"
        onAdd={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("ยังไม่มีรายการในหมวดนี้")).toBeInTheDocument();
    expect(screen.getByText("0 บาท")).toBeInTheDocument();
  });

  it("renders each item and a correct subtotal for the given month", () => {
    const items = [makeItem("1", 35000), makeItem("2", 8000)];
    render(
      <CategoryGroupCard
        category="income"
        items={items}
        month="2026-06"
        startMonth="2026-06"
        onAdd={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("43,000 บาท")).toBeInTheDocument();
  });

  it("toggles the add-item form open and closed", async () => {
    render(
      <CategoryGroupCard
        category="income"
        items={[]}
        month="2026-06"
        startMonth="2026-06"
        onAdd={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("รายการ")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "+ เพิ่มรายการ" }));
    expect(screen.getByLabelText("รายการ")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "ปิด" }));
    expect(screen.queryByLabelText("รายการ")).not.toBeInTheDocument();
  });

  it("closes the add-item form and forwards the new item after a successful add", async () => {
    const onAdd = vi.fn();
    render(
      <CategoryGroupCard
        category="income"
        items={[]}
        month="2026-06"
        startMonth="2026-06"
        onAdd={onAdd}
        onDelete={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "+ เพิ่มรายการ" }));
    await userEvent.type(screen.getByLabelText("รายการ"), "โบนัส");
    await userEvent.clear(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"));
    await userEvent.type(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"), "5000");
    await userEvent.click(screen.getByRole("button", { name: "เพิ่มรายการ" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    // Form collapses again after a successful add.
    expect(screen.queryByLabelText("รายการ")).not.toBeInTheDocument();
  });

  it("calls onDelete with the item id when a row's delete button is clicked", async () => {
    const onDelete = vi.fn();
    const items = [makeItem("1", 35000)];
    render(
      <CategoryGroupCard
        category="income"
        items={items}
        month="2026-06"
        startMonth="2026-06"
        onAdd={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "ลบ Item 1" }));
    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
