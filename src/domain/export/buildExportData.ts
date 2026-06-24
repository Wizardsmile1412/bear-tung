import { CashFlowProfile, MonthlyTotals } from "../model/CashFlowProfile";
import { MonthlyProjectionEntry } from "../projection/ProjectionService";
import { RatioResult } from "../ratios/Ratio";
import {
  CashFlowExportRow,
  ExportData,
  HealthExportRow,
  MortgageExportData,
  ProjectionExportRow,
} from "./ExportData";

/**
 * Short Thai descriptions of each ratio's healthy threshold, shown in the
 * "Health Check" export sheet. Keyed by `RatioResult.key`.
 */
const THRESHOLD_DESCRIPTIONS: Record<string, string> = {
  savingsRate: "ควรมากกว่า 20% ของรายรับ",
  dsr: "ควรไม่เกิน 40% ของรายรับ",
  emergencyFund: "ควรมีอย่างน้อย 3-6 เดือน",
};

/**
 * One already-Thai-labeled cash-flow row, supplied by the caller.
 *
 * `buildExportData` deliberately does NOT import `subCategoryLabel`/
 * `CATEGORY_LABELS` from `src/components/cashflow/subCategoryPresets` —
 * those are UI-layer presentation lookups (per that file's own comment,
 * "UI-only concern, not a domain rule"), and `src/domain/**` must never
 * import from `src/components/**`. Instead, the UI-layer caller (the
 * `useExport` hook) translates each `CashFlowProfile` item's raw
 * `category`/`subCategory` keys into Thai labels before calling this
 * function, and hands them in via `cashFlowRows`.
 */
export interface CashFlowRowInput {
  category: string; // already Thai-labeled
  subCategory: string; // already Thai-labeled
  label: string;
  amountPerMonth: number;
}

export interface BuildExportDataInput {
  profile: CashFlowProfile;
  cashFlowRows: CashFlowRowInput[];
  health: { month: string; totals: MonthlyTotals; score: number; light: string; results: RatioResult[] };
  projection: MonthlyProjectionEntry[];
  mortgage?: MortgageExportData;
}

/** Formats one ratio's raw value into the Thai display string for the export sheet. */
function formatValueDisplay(result: RatioResult): string {
  if (result.key === "emergencyFund") {
    return result.value === Infinity ? "ไม่จำกัด" : `${result.value.toFixed(1)} เดือน`;
  }
  // savingsRate, dsr, and any future percentage-based ratio.
  return `${Math.round(result.value * 100)}%`;
}

/**
 * Safe numeric value for the `HealthExportRow.value` field: guarantees no
 * `Infinity`/`NaN` ever reaches the spreadsheet. The unbounded
 * emergency-fund case is represented as 0 here — `valueDisplay` carries the
 * real ("ไม่จำกัด") meaning instead.
 */
function safeValue(result: RatioResult): number {
  return Number.isFinite(result.value) ? result.value : 0;
}

function toHealthExportRow(result: RatioResult): HealthExportRow {
  return {
    key: result.key,
    label: result.label,
    value: safeValue(result),
    valueDisplay: formatValueDisplay(result),
    thresholdDescription: THRESHOLD_DESCRIPTIONS[result.key] ?? "",
    score: result.score,
    status: result.status,
  };
}

function toCashFlowExportRow(row: CashFlowRowInput): CashFlowExportRow {
  return {
    category: row.category,
    subCategory: row.subCategory,
    label: row.label,
    amountPerMonth: row.amountPerMonth,
  };
}

function toProjectionExportRow(entry: MonthlyProjectionEntry): ProjectionExportRow {
  return {
    month: entry.month,
    totalIncome: entry.totalIncome,
    totalExpense: entry.totalExpense,
    totalDebt: entry.totalDebt,
    remainingCashFlow: entry.remainingCashFlow,
    score: entry.score,
    light: entry.light,
  };
}

/**
 * Pure assembly function: combines the current cash-flow snapshot, health
 * evaluation, 5-year projection, and (optional) mortgage assessment into the
 * flat `ExportData` shape `ExcelExporter` turns into a workbook. No React,
 * no SheetJS — easy to unit test in isolation.
 */
export function buildExportData(input: BuildExportDataInput): ExportData {
  const { profile, cashFlowRows, health, projection, mortgage } = input;

  return {
    month: health.month,
    cashFlow: {
      rows: cashFlowRows.map(toCashFlowExportRow),
      savings: profile.assets.savings,
      totalIncome: health.totals.totalIncome,
      totalExpense: health.totals.totalExpense,
      totalDebt: health.totals.totalDebt,
      remainingCashFlow: health.totals.remainingCashFlow,
    },
    health: {
      rows: health.results.map(toHealthExportRow),
      score: health.score,
      light: health.light,
    },
    mortgage,
    projection: projection.map(toProjectionExportRow),
  };
}
