import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { PROFILE_STORAGE_KEY } from "../../config/defaults";
import { CashFlowProfile } from "../../model/CashFlowProfile";
import { LineItem } from "../../model/LineItem";
import { LocalStorageProfileRepository } from "../LocalStorageProfileRepository";

describe("LocalStorageProfileRepository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("load() returns null when nothing is stored", () => {
    const repository = new LocalStorageProfileRepository();
    expect(repository.load()).toBeNull();
  });

  it("save() then load() round-trips the profile", () => {
    const repository = new LocalStorageProfileRepository();
    const profile = CashFlowProfile.empty("2026-06").addItem(
      LineItem.create({
        id: "1",
        category: "income",
        subCategory: "salary",
        label: "Salary",
        changes: [{ effectiveFrom: "2026-06", amount: 35000 }],
      }),
    );

    repository.save(profile);
    const loaded = repository.load();

    expect(loaded).not.toBeNull();
    expect(loaded!.startMonth).toBe("2026-06");
    expect(loaded!.items).toHaveLength(1);
    expect(loaded!.items[0].amountAt("2026-06")).toBe(35000);
  });

  it("save() then load() returns a real CashFlowProfile instance and round-trips every field, including nested changes and endMonth", () => {
    const repository = new LocalStorageProfileRepository();
    const profile = CashFlowProfile.empty("2026-06")
      .addItem(
        LineItem.create({
          id: "income-1",
          category: "income",
          subCategory: "salary",
          label: "Salary",
          changes: [
            { effectiveFrom: "2026-06", amount: 35000 },
            { effectiveFrom: "2027-01", amount: 45000 },
          ],
        }),
      )
      .addItem(
        LineItem.create({
          id: "debt-1",
          category: "debt",
          subCategory: "carLoan",
          label: "Car loan",
          changes: [{ effectiveFrom: "2026-06", amount: 10000 }],
          endMonth: "2027-03",
        }),
      )
      .updateAssets({ savings: 75000 });

    repository.save(profile);
    const loaded = repository.load();

    expect(loaded).toBeInstanceOf(CashFlowProfile);
    expect(loaded!.startMonth).toBe(profile.startMonth);
    expect(loaded!.assets).toEqual({ savings: 75000 });
    expect(loaded!.items).toHaveLength(2);

    const loadedIncome = loaded!.items.find((item) => item.id === "income-1")!;
    expect(loadedIncome.toJSON().changes).toEqual([
      { effectiveFrom: "2026-06", amount: 35000 },
      { effectiveFrom: "2027-01", amount: 45000 },
    ]);
    expect(loadedIncome.amountAt("2026-12")).toBe(35000);
    expect(loadedIncome.amountAt("2027-01")).toBe(45000);

    const loadedDebt = loaded!.items.find((item) => item.id === "debt-1")!;
    expect(loadedDebt.endMonth).toBe("2027-03");
    expect(loadedDebt.amountAt("2027-03")).toBe(10000);
    expect(loadedDebt.amountAt("2027-04")).toBe(0);
  });

  it("stores data under the documented storage key", () => {
    const repository = new LocalStorageProfileRepository();
    repository.save(CashFlowProfile.empty("2026-06"));

    expect(localStorage.getItem(PROFILE_STORAGE_KEY)).not.toBeNull();
  });

  it("load() returns null and does not throw on corrupt JSON", () => {
    localStorage.setItem(PROFILE_STORAGE_KEY, "{not valid json");

    const repository = new LocalStorageProfileRepository();
    expect(repository.load()).toBeNull();
  });

  describe("when running outside the browser (SSR, no window)", () => {
    const originalWindow = globalThis.window;

    beforeEach(() => {
      // @ts-expect-error simulating an SSR environment where `window` is undefined
      delete globalThis.window;
    });

    afterEach(() => {
      globalThis.window = originalWindow;
    });

    it("load() returns null without touching localStorage", () => {
      const repository = new LocalStorageProfileRepository();
      expect(repository.load()).toBeNull();
    });

    it("save() is a no-op", () => {
      const repository = new LocalStorageProfileRepository();
      expect(() => repository.save(CashFlowProfile.empty("2026-06"))).not.toThrow();
    });
  });
});
