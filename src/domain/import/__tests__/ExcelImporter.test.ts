import * as XLSX from "xlsx";
import { beforeEach, describe, expect, it } from "vitest";

import { createExcelImporter } from "../createExcelImporter";
import { ExcelImporter, ImportOptions } from "../ExcelImporter";
import { CategoryMapping } from "../ImportResult";

const mapping: CategoryMapping = {
  categoryThToKey: { รายรับ: "income", รายจ่าย: "expense", หนี้สิน: "debt" },
  subCategoryThToKey: {
    income: { เงินเดือน: "salary" },
    expense: { อาหาร: "food", ของใช้: "shopping" },
    debt: { ผ่อนรถ: "carLoan", สินเชื่อส่วนบุคคล: "personalLoan" },
  },
};

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/** Test-local inverse of the UI's `formatMonthLabel` (e.g. 'ส.ค. 2026' -> '2026-08'). */
function parsePayoffMonth(label: string): string | undefined {
  const [month, year] = label.split(" ");
  const index = THAI_MONTHS.indexOf(month);
  if (index < 0 || !year) {
    return undefined;
  }
  return `${year}-${String(index + 1).padStart(2, "0")}`;
}

const CASH_FLOW_HEADER = ["category", "subCategory", "label", "amountPerMonth", "ผ่อนหมดเดือน"];
const PROJECTION_HEADER = ["เดือน", "รายรับ", "รายจ่าย", "หนี้สิน", "เงินคงเหลือ", "คะแนน", "สถานะ"];

/** Builds a projection sheet AOA from a list of [month, income, expense, debt]. */
function projectionSheet(rows: Array<[string, number, number, number]>): unknown[][] {
  return [
    PROJECTION_HEADER,
    ...rows.map(([month, income, expense, debt]) => [month, income, expense, debt, income - expense - debt, 80, "green"]),
  ];
}

function makeWorkbook(sheets: Record<string, unknown[][]>): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  for (const [name, aoa] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(aoa), name);
  }
  return workbook;
}

describe("ExcelImporter", () => {
  let importer: ExcelImporter;
  let options: ImportOptions;

  beforeEach(() => {
    importer = createExcelImporter();
    let counter = 0;
    options = { mapping, parsePayoffMonth, generateId: () => `id-${counter++}` };
  });

  it("parses cash-flow line items, savings, and startMonth from a clean file", () => {
    const workbook = makeWorkbook({
      "Cash Flow": [
        CASH_FLOW_HEADER,
        ["รายรับ", "เงินเดือน", "เงินเดือนหลัก", 75000, ""],
        ["รายจ่าย", "อาหาร", "ค่าอาหาร", 9000, ""],
        ["หนี้สิน", "สินเชื่อส่วนบุคคล", "สินเชื่อ", 10000, ""],
        ["", "", "", "", ""],
        ["สรุป", "", "รวมรายรับ", 75000, ""],
        ["สรุป", "", "เงินสำรอง/เงินออม", 50000, ""],
      ],
      "Projection 5y": projectionSheet([
        ["2026-06", 75000, 9000, 10000],
        ["2026-07", 75000, 9000, 10000],
        ["2026-08", 75000, 9000, 10000],
      ]),
    });

    const result = importer.parse(workbook, options);

    expect(result.recognized).toBe(true);
    expect(result.warnings).toEqual([]);
    expect(result.profile.startMonth).toBe("2026-06");
    expect(result.profile.assets.savings).toBe(50000);
    expect(result.profile.items).toHaveLength(3);

    const income = result.profile.items[0];
    expect(income.category).toBe("income");
    expect(income.subCategory).toBe("salary");
    expect(income.label).toBe("เงินเดือนหลัก");
    expect(income.changes).toEqual([{ effectiveFrom: "2026-06", amount: 75000 }]);
    expect(income.endMonth).toBeUndefined();
    expect(income.id).toBe("id-0");
  });

  it("round-trips a debt payoff month into LineItem.endMonth without a false warning", () => {
    const workbook = makeWorkbook({
      "Cash Flow": [
        CASH_FLOW_HEADER,
        ["หนี้สิน", "ผ่อนรถ", "ผ่อนรถ", 20000, "ส.ค. 2026"],
      ],
      "Projection 5y": projectionSheet([
        ["2026-06", 0, 0, 20000],
        ["2026-07", 0, 0, 20000],
        ["2026-08", 0, 0, 20000], // endMonth is inclusive — still paying in Aug
        ["2026-09", 0, 0, 0], // paid off from Sep onward
        ["2026-10", 0, 0, 0],
      ]),
    });

    const result = importer.parse(workbook, options);

    expect(result.warnings).toEqual([]);
    expect(result.profile.items[0].endMonth).toBe("2026-08");
  });

  it("warns when the file's projection reveals future changes the snapshot lost", () => {
    const workbook = makeWorkbook({
      "Cash Flow": [
        CASH_FLOW_HEADER,
        ["รายรับ", "เงินเดือน", "เงินเดือน", 75000, ""],
      ],
      "Projection 5y": projectionSheet([
        ["2026-06", 75000, 0, 0],
        ["2026-07", 75000, 0, 0],
        ["2026-08", 90000, 0, 0], // raise the snapshot can't capture
        ["2026-09", 90000, 0, 0],
      ]),
    });

    const result = importer.parse(workbook, options);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("ตรวจพบการเปลี่ยนแปลงในอนาคต");
  });

  it("parses an older 4-column file with no payoff column", () => {
    const workbook = makeWorkbook({
      "Cash Flow": [
        ["category", "subCategory", "label", "amountPerMonth"],
        ["รายรับ", "เงินเดือน", "เงินเดือน", 60000],
      ],
      "Projection 5y": projectionSheet([["2026-06", 60000, 0, 0]]),
    });

    const result = importer.parse(workbook, options);

    expect(result.warnings).toEqual([]);
    expect(result.profile.items[0].changes[0].amount).toBe(60000);
    expect(result.profile.items[0].endMonth).toBeUndefined();
  });

  it("falls back to the raw Thai label for an unknown sub-category", () => {
    const workbook = makeWorkbook({
      "Cash Flow": [
        CASH_FLOW_HEADER,
        ["รายจ่าย", "ค่าฟิตเนส", "ยิม", 1500, ""],
      ],
      "Projection 5y": projectionSheet([["2026-06", 0, 1500, 0]]),
    });

    const result = importer.parse(workbook, options);

    expect(result.profile.items[0].subCategory).toBe("ค่าฟิตเนส");
  });

  it("skips rows with an unrecognized category", () => {
    const workbook = makeWorkbook({
      "Cash Flow": [
        CASH_FLOW_HEADER,
        ["???", "เงินเดือน", "ไม่รู้", 1000, ""],
        ["รายรับ", "เงินเดือน", "เงินเดือน", 75000, ""],
      ],
      "Projection 5y": projectionSheet([["2026-06", 75000, 0, 0]]),
    });

    const result = importer.parse(workbook, options);

    expect(result.profile.items).toHaveLength(1);
    expect(result.profile.items[0].label).toBe("เงินเดือน");
  });

  it("parses mortgage inputs including the co-borrower section", () => {
    const workbook = makeWorkbook({
      "Cash Flow": [CASH_FLOW_HEADER, ["รายรับ", "เงินเดือน", "เงินเดือน", 75000, ""]],
      "Projection 5y": projectionSheet([["2026-06", 75000, 0, 0]]),
      Mortgage: [
        ["รายการ", "ค่า"],
        ["--- ข้อมูลที่ใช้ประเมิน ---", ""],
        ["ราคาบ้าน", 4500000],
        ["บ้านลำดับที่", 2],
        ["อายุผู้กู้", 47],
        ["อัตราดอกเบี้ย (% ต่อปี)", 6.5],
        ["ระยะเวลากู้ (ปี)", 23],
        ["เงินดาวน์ที่มี", 20000],
        ["เพดาน DSR (%)", 40],
        ["--- ผลการประเมิน ---", ""],
        ["วงเงินกู้สูงสุด", 0],
        ["--- ผู้กู้ร่วม ---", ""],
        ["หนี้ปัจจุบันของผู้กู้ร่วม", 5000],
      ],
    });

    const { mortgageInputs } = importer.parse(workbook, options);

    expect(mortgageInputs).toEqual({
      homePrice: 4500000,
      homeOrder: 2,
      borrowerAge: 47,
      interestRatePercent: 6.5,
      loanTermYears: 23,
      downPaymentAvailable: 20000,
      dsrLimit: 0.4,
      coBorrowerEnabled: true,
      coDebt: 5000,
    });
  });

  it("returns no mortgage inputs for the placeholder ('no mortgage') sheet", () => {
    const workbook = makeWorkbook({
      "Cash Flow": [CASH_FLOW_HEADER, ["รายรับ", "เงินเดือน", "เงินเดือน", 75000, ""]],
      "Projection 5y": projectionSheet([["2026-06", 75000, 0, 0]]),
      Mortgage: [["ข้อมูล"], ["ยังไม่ได้กรอกข้อมูลประเมินสินเชื่อ — ไปที่หน้าประเมินสินเชื่อบ้านเพื่อกรอกข้อมูล"]],
    });

    const { mortgageInputs } = importer.parse(workbook, options);

    expect(mortgageInputs).toBeUndefined();
  });

  it("flags a non-Bear-tung file and returns an empty profile", () => {
    const workbook = makeWorkbook({ Sheet1: [["foo", "bar"], [1, 2]] });

    const result = importer.parse(workbook, options);

    expect(result.recognized).toBe(false);
    expect(result.profile.items).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("ไม่ใช่ไฟล์ Bear-tung");
  });
});
