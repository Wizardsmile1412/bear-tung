import { describe, expect, it } from "vitest";

import { LineItem } from "../LineItem";

describe("LineItem", () => {
  it("throws when constructed with no changes", () => {
    expect(() =>
      LineItem.create({
        id: "1",
        category: "income",
        subCategory: "salary",
        label: "Salary",
        changes: [],
      }),
    ).toThrow();
  });

  it("returns 0 before the first change", () => {
    const item = LineItem.create({
      id: "1",
      category: "income",
      subCategory: "salary",
      label: "Salary",
      changes: [{ effectiveFrom: "2026-06", amount: 35000 }],
    });

    expect(item.amountAt("2026-05")).toBe(0);
  });

  it("returns the change amount at and after effectiveFrom", () => {
    const item = LineItem.create({
      id: "1",
      category: "income",
      subCategory: "salary",
      label: "Salary",
      changes: [{ effectiveFrom: "2026-06", amount: 35000 }],
    });

    expect(item.amountAt("2026-06")).toBe(35000);
    expect(item.amountAt("2026-12")).toBe(35000);
  });

  it("carries forward through multiple changes (step function), sorted regardless of input order", () => {
    const item = LineItem.create({
      id: "1",
      category: "income",
      subCategory: "salary",
      label: "Salary",
      changes: [
        { effectiveFrom: "2027-01", amount: 45000 },
        { effectiveFrom: "2026-06", amount: 35000 },
      ],
    });

    expect(item.amountAt("2026-06")).toBe(35000);
    expect(item.amountAt("2026-12")).toBe(35000);
    expect(item.amountAt("2027-01")).toBe(45000);
    expect(item.amountAt("2027-06")).toBe(45000);
  });

  it("returns 0 after endMonth but stays active during the end month itself", () => {
    const item = LineItem.create({
      id: "1",
      category: "debt",
      subCategory: "carLoan",
      label: "Car loan",
      changes: [{ effectiveFrom: "2026-06", amount: 10000 }],
      endMonth: "2027-03",
    });

    expect(item.amountAt("2027-03")).toBe(10000);
    expect(item.amountAt("2027-04")).toBe(0);
  });

  it("round-trips through toJSON/fromJSON", () => {
    const original = LineItem.create({
      id: "1",
      category: "expense",
      subCategory: "food",
      label: "Food",
      changes: [{ effectiveFrom: "2026-06", amount: 5000 }],
    });

    const restored = LineItem.fromJSON(original.toJSON());
    expect(restored.amountAt("2026-06")).toBe(5000);
    expect(restored.id).toBe("1");
    expect(restored.label).toBe("Food");
  });

  it("exposes category and subCategory via getters", () => {
    const item = LineItem.create({
      id: "1",
      category: "debt",
      subCategory: "carLoan",
      label: "Car loan",
      changes: [{ effectiveFrom: "2026-06", amount: 10000 }],
    });

    expect(item.category).toBe("debt");
    expect(item.subCategory).toBe("carLoan");
    expect(item.endMonth).toBeUndefined();
  });

  it("exposes a defensive copy of changes, sorted ascending regardless of input order", () => {
    const item = LineItem.create({
      id: "1",
      category: "income",
      subCategory: "salary",
      label: "Salary",
      changes: [
        { effectiveFrom: "2027-01", amount: 45000 },
        { effectiveFrom: "2026-06", amount: 35000 },
      ],
    });

    const changes = item.changes;
    expect(changes).toEqual([
      { effectiveFrom: "2026-06", amount: 35000 },
      { effectiveFrom: "2027-01", amount: 45000 },
    ]);

    changes[0].amount = 999999;
    expect(item.changes[0].amount).toBe(35000);
  });

  it("returns the amount exactly between two changes (carries forward the earlier one)", () => {
    const item = LineItem.create({
      id: "1",
      category: "income",
      subCategory: "salary",
      label: "Salary",
      changes: [
        { effectiveFrom: "2026-06", amount: 35000 },
        { effectiveFrom: "2027-01", amount: 45000 },
      ],
    });

    // Between the two changes: still the earlier (carried-forward) amount.
    expect(item.amountAt("2026-09")).toBe(35000);
    expect(item.amountAt("2026-12")).toBe(35000);
  });

  it("carries forward correctly across 3+ sequential changes", () => {
    const item = LineItem.create({
      id: "1",
      category: "income",
      subCategory: "salary",
      label: "Salary",
      changes: [
        { effectiveFrom: "2026-06", amount: 30000 },
        { effectiveFrom: "2027-01", amount: 35000 },
        { effectiveFrom: "2027-06", amount: 40000 },
        { effectiveFrom: "2028-01", amount: 50000 },
      ],
    });

    expect(item.amountAt("2026-06")).toBe(30000);
    expect(item.amountAt("2026-12")).toBe(30000);
    expect(item.amountAt("2027-01")).toBe(35000);
    expect(item.amountAt("2027-05")).toBe(35000);
    expect(item.amountAt("2027-06")).toBe(40000);
    expect(item.amountAt("2027-12")).toBe(40000);
    expect(item.amountAt("2028-01")).toBe(50000);
    expect(item.amountAt("2030-01")).toBe(50000);
  });

  it("returns 0 for every month once past endMonth, even far in the future", () => {
    const item = LineItem.create({
      id: "1",
      category: "debt",
      subCategory: "carLoan",
      label: "Car loan",
      changes: [{ effectiveFrom: "2026-06", amount: 10000 }],
      endMonth: "2027-03",
    });

    expect(item.amountAt("2027-02")).toBe(10000);
    expect(item.amountAt("2027-03")).toBe(10000);
    expect(item.amountAt("2027-04")).toBe(0);
    expect(item.amountAt("2030-01")).toBe(0);
  });
});
