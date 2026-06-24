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

describe("LineItemRow", () => {
  it("renders the label, sub-category, and formatted amount", () => {
    render(<LineItemRow item={makeItem()} amount={35000} onDelete={vi.fn()} />);

    expect(screen.getByText("เงินเดือนประจำ")).toBeInTheDocument();
    expect(screen.getByText("เงินเดือน")).toBeInTheDocument();
    expect(screen.getByText("35,000 บาท")).toBeInTheDocument();
  });

  it("calls onDelete with the item id when the delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(<LineItemRow item={makeItem()} amount={35000} onDelete={onDelete} />);

    await userEvent.click(screen.getByRole("button", { name: "ลบ เงินเดือนประจำ" }));

    expect(onDelete).toHaveBeenCalledWith("income-1");
  });
});
