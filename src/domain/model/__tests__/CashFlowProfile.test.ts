import { describe, expect, it } from "vitest";

import { CashFlowProfile } from "../CashFlowProfile";
import { LineItem } from "../LineItem";
import { MonthKey } from "../MonthKey";

function makeItem(category: "income" | "expense" | "debt", amount: number, id = crypto.randomUUID()) {
  return LineItem.create({
    id,
    category,
    subCategory: "other",
    label: "Test item",
    changes: [{ effectiveFrom: "2026-06", amount }],
  });
}

describe("CashFlowProfile", () => {
  it("empty() starts with no items and zero savings", () => {
    const profile = CashFlowProfile.empty("2026-06");
    expect(profile.items).toEqual([]);
    expect(profile.assets.savings).toBe(0);
    expect(profile.startMonth).toBe("2026-06");
  });

  it("empty() defaults startMonth to the current month when omitted", () => {
    const profile = CashFlowProfile.empty();
    expect(profile.startMonth).toBe(MonthKey.current().toString());
  });

  it("addItem returns a new profile and does not mutate the original", () => {
    const original = CashFlowProfile.empty("2026-06");
    const item = makeItem("income", 35000);

    const updated = original.addItem(item);

    expect(original.items).toHaveLength(0);
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].id).toBe(item.id);
  });

  it("removeItem returns a new profile without that item, leaving the original unchanged", () => {
    const item = makeItem("income", 35000);
    const profile = CashFlowProfile.empty("2026-06").addItem(item);

    const updated = profile.removeItem(item.id);

    // Assert the original reference's `.items` still has the old contents.
    expect(profile.items).toHaveLength(1);
    expect(profile.items[0].id).toBe(item.id);
    expect(updated.items).toHaveLength(0);
  });

  it("updateItem replaces the item with matching id, immutably", () => {
    const item = makeItem("income", 35000, "income-1");
    const profile = CashFlowProfile.empty("2026-06").addItem(item);

    const replacement = makeItem("income", 45000, "income-1");
    const updated = profile.updateItem("income-1", replacement);

    // The original instance is unchanged after the call.
    expect(profile.items).toHaveLength(1);
    expect(profile.items[0].amountAt("2026-06")).toBe(35000);
    expect(updated.items[0].amountAt("2026-06")).toBe(45000);
  });

  it("updateItem only replaces the matching item, leaving other items untouched", () => {
    const incomeItem = makeItem("income", 35000, "income-1");
    const expenseItem = makeItem("expense", 10000, "expense-1");
    const profile = CashFlowProfile.empty("2026-06").addItem(incomeItem).addItem(expenseItem);

    const replacement = makeItem("income", 45000, "income-1");
    const updated = profile.updateItem("income-1", replacement);

    expect(updated.items).toHaveLength(2);
    const updatedExpense = updated.items.find((entry) => entry.id === "expense-1")!;
    expect(updatedExpense).toBe(expenseItem);
    expect(updatedExpense.amountAt("2026-06")).toBe(10000);
  });

  it("updateAssets merges into existing assets, immutably", () => {
    const profile = CashFlowProfile.empty("2026-06");
    const updated = profile.updateAssets({ savings: 100000 });

    expect(profile.assets.savings).toBe(0);
    expect(updated.assets.savings).toBe(100000);
  });

  it("monthlyTotals sums income/expense/debt and computes remaining cash flow", () => {
    const profile = CashFlowProfile.empty("2026-06")
      .addItem(makeItem("income", 35000))
      .addItem(makeItem("expense", 10000))
      .addItem(makeItem("debt", 5000));

    const totals = profile.monthlyTotals("2026-06");

    expect(totals.totalIncome).toBe(35000);
    expect(totals.totalExpense).toBe(10000);
    expect(totals.totalDebt).toBe(5000);
    expect(totals.remainingCashFlow).toBe(20000);
  });

  it("monthlyTotals sums multiple items within the same category correctly", () => {
    const profile = CashFlowProfile.empty("2026-06")
      .addItem(makeItem("income", 35000))
      .addItem(makeItem("income", 8000))
      .addItem(makeItem("expense", 10000))
      .addItem(makeItem("expense", 4000))
      .addItem(makeItem("debt", 5000))
      .addItem(makeItem("debt", 3000));

    const totals = profile.monthlyTotals("2026-06");

    expect(totals.totalIncome).toBe(43000);
    expect(totals.totalExpense).toBe(14000);
    expect(totals.totalDebt).toBe(8000);
    expect(totals.remainingCashFlow).toBe(21000);
  });

  it("monthlyTotals reports a negative remainingCashFlow when overspending", () => {
    const profile = CashFlowProfile.empty("2026-06")
      .addItem(makeItem("income", 20000))
      .addItem(makeItem("expense", 18000))
      .addItem(makeItem("debt", 10000));

    const totals = profile.monthlyTotals("2026-06");

    expect(totals.remainingCashFlow).toBe(-8000);
  });

  it("an empty profile returns all zeros for any month with no divide-by-zero or crash", () => {
    const profile = CashFlowProfile.empty("2026-06");

    expect(() => profile.monthlyTotals("2030-01")).not.toThrow();
    const totals = profile.monthlyTotals("2030-01");

    expect(totals).toEqual({
      totalIncome: 0,
      totalExpense: 0,
      totalDebt: 0,
      remainingCashFlow: 0,
    });
  });

  it("round-trips through toJSON/fromJSON", () => {
    const profile = CashFlowProfile.empty("2026-06")
      .addItem(makeItem("income", 35000))
      .updateAssets({ savings: 50000 });

    const restored = CashFlowProfile.fromJSON(profile.toJSON());

    expect(restored.items).toHaveLength(1);
    expect(restored.assets.savings).toBe(50000);
    expect(restored.monthlyTotals("2026-06").totalIncome).toBe(35000);
  });
});
