import * as XLSX from "xlsx";

import { Exporter } from "./Exporter";
import { ExportData, MortgageExportData } from "./ExportData";

const THOUSANDS_FORMAT = "#,##0";

/** Sheet names, in export order. Each is well under Excel's 31-char limit. */
const SHEET_NAMES = {
  cashFlow: "Cash Flow",
  health: "Health Check",
  mortgage: "Mortgage",
  projection: "Projection 5y",
} as const;

const NO_MORTGAGE_MESSAGE =
  "ยังไม่ได้กรอกข้อมูลประเมินสินเชื่อ — ไปที่หน้าประเมินสินเชื่อบ้านเพื่อกรอกข้อมูล";

/** Applies a `'#,##0'` number format to one column across all data rows of a sheet. */
function applyThousandsFormat(sheet: XLSX.WorkSheet, columnIndex: number, rowCount: number): void {
  // Row 0 is the header (written by json_to_sheet); data rows start at 1.
  for (let row = 1; row <= rowCount; row++) {
    const address = XLSX.utils.encode_cell({ r: row, c: columnIndex });
    const cell = sheet[address];
    if (cell) {
      cell.z = THOUSANDS_FORMAT;
    }
  }
}

interface CashFlowSheetRow {
  category: string;
  subCategory: string;
  label: string;
  amountPerMonth: number | string;
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
    }));

    // Summary block appended below the line items (spec 9, Sheet 1): totals
    // for income/expense/debt/remaining + current savings.
    rows.push(
      { category: "", subCategory: "", label: "", amountPerMonth: "" },
      { category: "สรุป", subCategory: "", label: "รวมรายรับ", amountPerMonth: data.cashFlow.totalIncome },
      { category: "สรุป", subCategory: "", label: "รวมรายจ่าย", amountPerMonth: data.cashFlow.totalExpense },
      { category: "สรุป", subCategory: "", label: "รวมหนี้สิน", amountPerMonth: data.cashFlow.totalDebt },
      { category: "สรุป", subCategory: "", label: "เงินคงเหลือ", amountPerMonth: data.cashFlow.remainingCashFlow },
      { category: "สรุป", subCategory: "", label: "เงินสำรอง/เงินออม", amountPerMonth: data.cashFlow.savings },
    );

    const sheet = XLSX.utils.json_to_sheet(rows);
    applyThousandsFormat(sheet, 3, rows.length);
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

    return XLSX.utils.json_to_sheet(rows);
  }

  private buildMortgageSheet(mortgage: MortgageExportData | undefined): XLSX.WorkSheet {
    if (!mortgage) {
      return XLSX.utils.json_to_sheet([{ ข้อมูล: NO_MORTGAGE_MESSAGE }]);
    }

    const { input, result, coBorrower } = mortgage;
    const rows: Array<{ รายการ: string; ค่า: string | number }> = [
      { รายการ: "--- ข้อมูลที่ใช้ประเมิน ---", ค่า: "" },
      { รายการ: "ราคาบ้าน", ค่า: input.homePrice },
      { รายการ: "บ้านลำดับที่", ค่า: input.homeOrder },
      { รายการ: "อายุผู้กู้", ค่า: input.borrowerAge },
      { รายการ: "อัตราดอกเบี้ย (% ต่อปี)", ค่า: input.interestRatePercent },
      { รายการ: "ระยะเวลากู้ (ปี)", ค่า: input.loanTermYears },
      { รายการ: "เงินดาวน์ที่มี", ค่า: input.downPaymentAvailable },
      { รายการ: "เพดาน DSR (%)", ค่า: input.dsrLimit * 100 },
      { รายการ: "--- ผลการประเมิน ---", ค่า: "" },
      { รายการ: "วงเงินกู้สูงสุด", ค่า: result.maxLoan },
      { รายการ: "LTV (%)", ค่า: result.ltvPercent * 100 },
      { รายการ: "เงินดาวน์ที่ต้องใช้", ค่า: result.requiredDownPayment },
      { รายการ: "ราคาบ้านที่ซื้อได้สูงสุด", ค่า: result.affordableHomePrice },
      { รายการ: "ค่าผ่อนต่อเดือน (ประมาณ)", ค่า: result.monthlyPayment },
      { รายการ: "DSR หลังมีสินเชื่อ (%)", ค่า: result.dsrAfterLoan * 100 },
      { รายการ: "ปัจจัยที่เป็นตัวจำกัด", ค่า: result.bindingConstraint },
      { รายการ: "ชุดเกณฑ์ LTV ที่ใช้", ค่า: result.ltvPolicyName },
      { รายการ: "ซื้อบ้านราคานี้ได้หรือไม่", ค่า: result.canAffordTarget ? "ได้" : "ไม่ได้" },
    ];

    if (coBorrower) {
      rows.push(
        { รายการ: "--- ผู้กู้ร่วม ---", ค่า: "" },
        { รายการ: "หนี้ปัจจุบันของผู้กู้ร่วม", ค่า: coBorrower.input.coDebt },
        { รายการ: "LTV เป็นข้อจำกัด (ผู้กู้ร่วมช่วยไม่ได้)", ค่า: coBorrower.result.isLtvBound ? "ใช่" : "ไม่ใช่" },
        { รายการ: "มีคุณสมบัติเพียงพอแล้ว (ไม่ต้องมีผู้กู้ร่วม)", ค่า: coBorrower.result.alreadyQualifies ? "ใช่" : "ไม่ใช่" },
        { รายการ: "รายได้ผู้กู้ร่วมที่ต้องการอย่างน้อย", ค่า: coBorrower.result.requiredCoIncome },
      );

      if (coBorrower.result.combinedIncomeSufficient !== undefined) {
        rows.push({
          รายการ: "รายได้รวมเพียงพอหรือไม่",
          ค่า: coBorrower.result.combinedIncomeSufficient ? "เพียงพอ" : "ไม่เพียงพอ",
        });
      }
    }

    return XLSX.utils.json_to_sheet(rows);
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
    applyThousandsFormat(sheet, 1, rows.length);
    applyThousandsFormat(sheet, 2, rows.length);
    applyThousandsFormat(sheet, 3, rows.length);
    applyThousandsFormat(sheet, 4, rows.length);
    return sheet;
  }
}
