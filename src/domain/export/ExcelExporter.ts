import * as XLSX from "xlsx";

import { Exporter } from "./Exporter";
import { ExportData, MortgageExportData } from "./ExportData";

/** Whole-baht money: thousands separator, no decimals (money is stored/displayed as whole baht — see `Money.format`). */
const THOUSANDS_FORMAT = "#,##0";
/** Percentage-style decimal fields (interest rate, DSR, LTV): thousands separator + 2 decimal places. */
const DECIMAL_FORMAT = "#,##0.00";

/** Sheet names, in export order. Each is well under Excel's 31-char limit. */
const SHEET_NAMES = {
  cashFlow: "Cash Flow",
  health: "Health Check",
  mortgage: "Mortgage",
  projection: "Projection 5y",
} as const;

const NO_MORTGAGE_MESSAGE =
  "ยังไม่ได้กรอกข้อมูลประเมินสินเชื่อ — ไปที่หน้าประเมินสินเชื่อบ้านเพื่อกรอกข้อมูล";

/** Sets a number format on one cell, if present. Row 0 is the header (written by json_to_sheet); data rows start at 1. */
function setCellFormat(sheet: XLSX.WorkSheet, columnIndex: number, rowIndex: number, format: string): void {
  const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
  const cell = sheet[address];
  if (cell) {
    cell.z = format;
  }
}

/** Applies a number format to one column across all data rows of a sheet. */
function applyColumnFormat(sheet: XLSX.WorkSheet, columnIndex: number, rowCount: number, format: string): void {
  for (let row = 1; row <= rowCount; row++) {
    setCellFormat(sheet, columnIndex, row, format);
  }
}

interface CashFlowSheetRow {
  category: string;
  subCategory: string;
  label: string;
  amountPerMonth: number | string;
  ผ่อนหมดเดือน: string; // debt rows with a set payoff month only; "" otherwise
}

interface HealthSheetRow {
  รายการ: string;
  มูลค่า: string;
  เกณฑ์ที่ควรเป็น: string;
  คะแนน: number;
  สถานะ: string;
}

interface ProjectionSheetRow {
  เดือน: string;
  รายรับ: number;
  รายจ่าย: number;
  หนี้สิน: number;
  เงินคงเหลือ: number;
  คะแนน: number;
  สถานะ: string;
}

/**
 * SheetJS-backed `Exporter` implementation. Split into `buildWorkbook`
 * (pure, side-effect-free, the part worth testing thoroughly) and `export`
 * (triggers the browser download via `XLSX.writeFile`, hard to meaningfully
 * test in jsdom).
 */
export class ExcelExporter implements Exporter {
  buildWorkbook(data: ExportData): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, this.buildCashFlowSheet(data), SHEET_NAMES.cashFlow);
    XLSX.utils.book_append_sheet(workbook, this.buildHealthSheet(data), SHEET_NAMES.health);
    XLSX.utils.book_append_sheet(workbook, this.buildMortgageSheet(data.mortgage), SHEET_NAMES.mortgage);
    XLSX.utils.book_append_sheet(workbook, this.buildProjectionSheet(data), SHEET_NAMES.projection);

    return workbook;
  }

  export(data: ExportData, fileName: string): void {
    XLSX.writeFile(this.buildWorkbook(data), fileName);
  }

  private buildCashFlowSheet(data: ExportData): XLSX.WorkSheet {
    const rows: CashFlowSheetRow[] = data.cashFlow.rows.map((row) => ({
      category: row.category,
      subCategory: row.subCategory,
      label: row.label,
      amountPerMonth: row.amountPerMonth,
      ผ่อนหมดเดือน: row.payoffMonth ?? "",
    }));

    // Summary block appended below the line items (spec 9, Sheet 1): totals
    // for income/expense/debt/remaining + current savings.
    rows.push(
      { category: "", subCategory: "", label: "", amountPerMonth: "", ผ่อนหมดเดือน: "" },
      { category: "สรุป", subCategory: "", label: "รวมรายรับ", amountPerMonth: data.cashFlow.totalIncome, ผ่อนหมดเดือน: "" },
      { category: "สรุป", subCategory: "", label: "รวมรายจ่าย", amountPerMonth: data.cashFlow.totalExpense, ผ่อนหมดเดือน: "" },
      { category: "สรุป", subCategory: "", label: "รวมหนี้สิน", amountPerMonth: data.cashFlow.totalDebt, ผ่อนหมดเดือน: "" },
      { category: "สรุป", subCategory: "", label: "เงินคงเหลือ", amountPerMonth: data.cashFlow.remainingCashFlow, ผ่อนหมดเดือน: "" },
      { category: "สรุป", subCategory: "", label: "เงินสำรอง/เงินออม", amountPerMonth: data.cashFlow.savings, ผ่อนหมดเดือน: "" },
    );

    const sheet = XLSX.utils.json_to_sheet(rows);
    applyColumnFormat(sheet, 3, rows.length, THOUSANDS_FORMAT);
    return sheet;
  }

  private buildHealthSheet(data: ExportData): XLSX.WorkSheet {
    const rows: Array<Omit<HealthSheetRow, "คะแนน"> & { คะแนน: number | string }> = data.health.rows.map(
      (row) => ({
        รายการ: row.label,
        มูลค่า: row.valueDisplay,
        เกณฑ์ที่ควรเป็น: row.thresholdDescription,
        คะแนน: row.score,
        สถานะ: row.status,
      }),
    );

    rows.push(
      { รายการ: "", มูลค่า: "", เกณฑ์ที่ควรเป็น: "", คะแนน: "", สถานะ: "" },
      {
        รายการ: "คะแนนสุขภาพการเงินโดยรวม",
        มูลค่า: "",
        เกณฑ์ที่ควรเป็น: "",
        คะแนน: data.health.score,
        สถานะ: data.health.light,
      },
    );

    const sheet = XLSX.utils.json_to_sheet(rows);
    // คะแนน (score): per-ratio scores are a linear interpolation (see SavingsRateRatio
    // etc.) and can land on a decimal, unlike the Math.round'ed overall health score.
    applyColumnFormat(sheet, 3, rows.length, DECIMAL_FORMAT);
    return sheet;
  }

  private buildMortgageSheet(mortgage: MortgageExportData | undefined): XLSX.WorkSheet {
    if (!mortgage) {
      return XLSX.utils.json_to_sheet([{ ข้อมูล: NO_MORTGAGE_MESSAGE }]);
    }

    const { input, result, coBorrower } = mortgage;
    // `format` picks the number format applied to "ค่า" below — the column mixes money,
    // percentages, plain counts, and strings, so (unlike the other sheets) it can't be
    // formatted uniformly per-column and needs a per-row hint instead.
    const rows: Array<{ รายการ: string; ค่า: string | number; format?: "money" | "decimal" }> = [
      { รายการ: "--- ข้อมูลที่ใช้ประเมิน ---", ค่า: "" },
      { รายการ: "ราคาบ้าน", ค่า: input.homePrice, format: "money" },
      { รายการ: "บ้านลำดับที่", ค่า: input.homeOrder },
      { รายการ: "อายุผู้กู้", ค่า: input.borrowerAge },
      { รายการ: "อัตราดอกเบี้ย (% ต่อปี)", ค่า: input.interestRatePercent, format: "decimal" },
      { รายการ: "ระยะเวลากู้ (ปี)", ค่า: input.loanTermYears },
      { รายการ: "เงินดาวน์ที่มี", ค่า: input.downPaymentAvailable, format: "money" },
      { รายการ: "เพดาน DSR (%)", ค่า: input.dsrLimit * 100, format: "decimal" },
      { รายการ: "--- ผลการประเมิน ---", ค่า: "" },
      { รายการ: "วงเงินกู้สูงสุด", ค่า: result.maxLoan, format: "money" },
      { รายการ: "LTV (%)", ค่า: result.ltvPercent * 100, format: "decimal" },
      { รายการ: "เงินดาวน์ที่ต้องใช้", ค่า: result.requiredDownPayment, format: "money" },
      { รายการ: "ราคาบ้านที่ซื้อได้สูงสุด", ค่า: result.affordableHomePrice, format: "money" },
      { รายการ: "ค่าผ่อนต่อเดือน (ประมาณ)", ค่า: result.monthlyPayment, format: "money" },
      { รายการ: "DSR หลังมีสินเชื่อ (%)", ค่า: result.dsrAfterLoan * 100, format: "decimal" },
      { รายการ: "ปัจจัยที่เป็นตัวจำกัด", ค่า: result.bindingConstraint },
      { รายการ: "ชุดเกณฑ์ LTV ที่ใช้", ค่า: result.ltvPolicyName },
      { รายการ: "ซื้อบ้านราคานี้ได้หรือไม่", ค่า: result.canAffordTarget ? "ได้" : "ไม่ได้" },
    ];

    if (coBorrower) {
      rows.push(
        { รายการ: "--- ผู้กู้ร่วม ---", ค่า: "" },
        { รายการ: "หนี้ปัจจุบันของผู้กู้ร่วม", ค่า: coBorrower.input.coDebt, format: "money" },
        { รายการ: "LTV เป็นข้อจำกัด (ผู้กู้ร่วมช่วยไม่ได้)", ค่า: coBorrower.result.isLtvBound ? "ใช่" : "ไม่ใช่" },
        { รายการ: "มีคุณสมบัติเพียงพอแล้ว (ไม่ต้องมีผู้กู้ร่วม)", ค่า: coBorrower.result.alreadyQualifies ? "ใช่" : "ไม่ใช่" },
        { รายการ: "รายได้ผู้กู้ร่วมที่ต้องการอย่างน้อย", ค่า: coBorrower.result.requiredCoIncome, format: "money" },
      );

      if (coBorrower.result.combinedIncomeSufficient !== undefined) {
        rows.push({
          รายการ: "รายได้รวมเพียงพอหรือไม่",
          ค่า: coBorrower.result.combinedIncomeSufficient ? "เพียงพอ" : "ไม่เพียงพอ",
        });
      }
    }

    const sheet = XLSX.utils.json_to_sheet(rows.map(({ รายการ, ค่า }) => ({ รายการ, ค่า })));
    rows.forEach((row, index) => {
      if (row.format === "money") setCellFormat(sheet, 1, index + 1, THOUSANDS_FORMAT);
      else if (row.format === "decimal") setCellFormat(sheet, 1, index + 1, DECIMAL_FORMAT);
    });
    return sheet;
  }

  private buildProjectionSheet(data: ExportData): XLSX.WorkSheet {
    const rows: ProjectionSheetRow[] = data.projection.map((entry) => ({
      เดือน: entry.month,
      รายรับ: entry.totalIncome,
      รายจ่าย: entry.totalExpense,
      หนี้สิน: entry.totalDebt,
      เงินคงเหลือ: entry.remainingCashFlow,
      คะแนน: entry.score,
      สถานะ: entry.light,
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    // Columns: 0 เดือน, 1 รายรับ, 2 รายจ่าย, 3 หนี้สิน, 4 เงินคงเหลือ — all money columns.
    applyColumnFormat(sheet, 1, rows.length, THOUSANDS_FORMAT);
    applyColumnFormat(sheet, 2, rows.length, THOUSANDS_FORMAT);
    applyColumnFormat(sheet, 3, rows.length, THOUSANDS_FORMAT);
    applyColumnFormat(sheet, 4, rows.length, THOUSANDS_FORMAT);
    return sheet;
  }
}
