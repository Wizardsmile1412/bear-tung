import { describe, expect, it } from "vitest";

import { CATEGORY_LABELS, SUB_CATEGORY_PRESETS, subCategoryLabel } from "../subCategoryPresets";

describe("subCategoryPresets", () => {
  it("provides preset options for every category", () => {
    expect(SUB_CATEGORY_PRESETS.income.length).toBeGreaterThan(0);
    expect(SUB_CATEGORY_PRESETS.expense.length).toBeGreaterThan(0);
    expect(SUB_CATEGORY_PRESETS.debt.length).toBeGreaterThan(0);
  });

  it("subCategoryLabel resolves a known preset to its Thai label", () => {
    expect(subCategoryLabel("income", "salary")).toBe("เงินเดือน");
    expect(subCategoryLabel("debt", "carLoan")).toBe("ผ่อนรถ");
  });

  it("subCategoryLabel falls back to the raw value when unknown", () => {
    expect(subCategoryLabel("income", "unknown-thing")).toBe("unknown-thing");
  });

  it("CATEGORY_LABELS provides a Thai label for every category", () => {
    expect(CATEGORY_LABELS.income).toBe("รายรับ");
    expect(CATEGORY_LABELS.expense).toBe("รายจ่าย");
    expect(CATEGORY_LABELS.debt).toBe("หนี้สิน");
  });
});
