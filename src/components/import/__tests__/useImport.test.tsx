import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as XLSX from "xlsx";

import { MORTGAGE_FORM_STORAGE_KEY } from "@/domain/config/defaults";
import { LineItem } from "@/domain/model/LineItem";

import { ProfileProvider } from "@/components/profile/ProfileProvider";
import { useProfile } from "@/components/profile/useProfile";

import { ImportSummary, useImport } from "../useImport";

const CASH_FLOW_HEADER = ["category", "subCategory", "label", "amountPerMonth", "ผ่อนหมดเดือน"];
const PROJECTION_HEADER = ["เดือน", "รายรับ", "รายจ่าย", "หนี้สิน", "เงินคงเหลือ", "คะแนน", "สถานะ"];

function makeWorkbookFile(sheets: Record<string, unknown[][]>, name = "bear-tung.xlsx"): File {
  const workbook = XLSX.utils.book_new();
  for (const [sheetName, aoa] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(aoa), sheetName);
  }
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new File([buffer], name, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

const cashFlowOnlyFile = () =>
  makeWorkbookFile({
    "Cash Flow": [CASH_FLOW_HEADER, ["รายรับ", "เงินเดือน", "เงินเดือนหลัก", 75000, ""]],
    "Projection 5y": [PROJECTION_HEADER, ["2026-06", 75000, 0, 0, 75000, 80, "green"]],
  });

let lastSummary: ImportSummary | null;
let lastError: string | null;

function TestConsumer() {
  const { profile, addItem } = useProfile();
  const { importFromFile } = useImport();

  return (
    <div>
      <span data-testid="count">{profile.items.length}</span>
      <button
        onClick={() =>
          addItem(
            LineItem.create({
              id: "seed",
              category: "income",
              subCategory: "salary",
              label: "เดิม",
              changes: [{ effectiveFrom: profile.startMonth, amount: 1000 }],
            }),
          )
        }
      >
        seed
      </button>
      <input
        data-testid="file"
        type="file"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          try {
            lastSummary = await importFromFile(file);
          } catch (error) {
            lastError = error instanceof Error ? error.message : "unknown";
          }
        }}
      />
    </div>
  );
}

function renderConsumer() {
  return render(
    <ProfileProvider>
      <TestConsumer />
    </ProfileProvider>,
  );
}

describe("useImport", () => {
  beforeEach(() => {
    localStorage.clear();
    lastSummary = null;
    lastError = null;
  });

  it("replaces the profile with the imported line items", async () => {
    renderConsumer();

    await userEvent.upload(screen.getByTestId("file"), cashFlowOnlyFile());

    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(lastSummary).toMatchObject({ itemCount: 1, hasMortgage: false, warnings: [] });
  });

  it("saves mortgage inputs to storage when the file has a Mortgage sheet", async () => {
    const file = makeWorkbookFile({
      "Cash Flow": [CASH_FLOW_HEADER, ["รายรับ", "เงินเดือน", "เงินเดือน", 75000, ""]],
      "Projection 5y": [PROJECTION_HEADER, ["2026-06", 75000, 0, 0, 75000, 80, "green"]],
      Mortgage: [
        ["รายการ", "ค่า"],
        ["ราคาบ้าน", 4500000],
        ["บ้านลำดับที่", 1],
        ["อายุผู้กู้", 40],
        ["อัตราดอกเบี้ย (% ต่อปี)", 6.5],
        ["ระยะเวลากู้ (ปี)", 30],
        ["เงินดาวน์ที่มี", 500000],
        ["เพดาน DSR (%)", 40],
      ],
    });

    renderConsumer();
    await userEvent.upload(screen.getByTestId("file"), file);

    expect(lastSummary?.hasMortgage).toBe(true);
    const stored = JSON.parse(localStorage.getItem(MORTGAGE_FORM_STORAGE_KEY)!);
    expect(stored).toMatchObject({
      homePrice: 4500000,
      borrowerAge: 40,
      interestRatePercent: 6.5,
      loanTermYears: 30,
      downPaymentAvailable: 500000,
      dsrLimitPercent: 40, // normalized from the sheet's 0-1 dsrLimit
    });
  });

  it("rejects an invalid file without wiping existing data", async () => {
    const badFile = makeWorkbookFile({ Sheet1: [["foo"], ["bar"]] }, "random.xlsx");

    renderConsumer();
    await userEvent.click(screen.getByRole("button", { name: "seed" }));
    expect(screen.getByTestId("count").textContent).toBe("1");

    await userEvent.upload(screen.getByTestId("file"), badFile);

    expect(lastError).toMatch(/Bear-tung/);
    expect(screen.getByTestId("count").textContent).toBe("1"); // existing data preserved
  });

  it("clears a stale mortgage form when re-importing a file without a Mortgage sheet", async () => {
    localStorage.setItem(MORTGAGE_FORM_STORAGE_KEY, JSON.stringify({ homePrice: 1 }));

    renderConsumer();
    await userEvent.upload(screen.getByTestId("file"), cashFlowOnlyFile());

    expect(localStorage.getItem(MORTGAGE_FORM_STORAGE_KEY)).toBeNull();
  });
});
