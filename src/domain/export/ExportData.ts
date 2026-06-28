import { CoBorrowerInput, CoBorrowerResult } from "../mortgage/CoBorrowerService";
import { MortgageInput, MortgageResult } from "../mortgage/MortgageService";

/**
 * Plain type definitions for the 4-sheet Excel export (spec section 9).
 * No logic lives here — see `buildExportData.ts` for construction and
 * `ExcelExporter.ts` for turning this into a workbook.
 */

export interface CashFlowExportRow {
  category: string; // Thai label, e.g. 'รายรับ'
  subCategory: string; // Thai label, e.g. 'เงินเดือน'
  label: string; // user's own label for the line item
  amountPerMonth: number;
  payoffMonth?: string; // pre-formatted Thai month label (e.g. 'มิ.ย. 2026'); debt rows with a set LineItem.endMonth only
}

export interface HealthExportRow {
  key: string;
  label: string;
  /**
   * Raw ratio value. Must never be `Infinity`/`NaN` (an unbounded emergency
   * fund is represented as 0 here, with the real meaning carried by
   * `valueDisplay` instead) — Excel has no concept of an infinite cell value.
   */
  value: number;
  valueDisplay: string; // pre-formatted display string, handles the Infinity case ('ไม่จำกัด')
  thresholdDescription: string; // short Thai description of the healthy threshold
  score: number;
  status: string; // 'good' | 'warning' | 'danger'
}

export interface ProjectionExportRow {
  month: string;
  totalIncome: number;
  totalExpense: number;
  totalDebt: number;
  remainingCashFlow: number;
  score: number;
  light: string; // 'green' | 'yellow' | 'red'
}

export interface MortgageExportData {
  input: MortgageInput;
  result: MortgageResult;
  coBorrower?: {
    input: CoBorrowerInput;
    result: CoBorrowerResult;
  };
}

export interface ExportData {
  month: string; // the "current" month this snapshot reflects (Sheet 1 + 2)
  cashFlow: {
    rows: CashFlowExportRow[];
    savings: number;
    totalIncome: number;
    totalExpense: number;
    totalDebt: number;
    remainingCashFlow: number;
  };
  health: { rows: HealthExportRow[]; score: number; light: string };
  mortgage?: MortgageExportData; // undefined when exported from a page/state with no mortgage assessment yet
  projection: ProjectionExportRow[];
}
