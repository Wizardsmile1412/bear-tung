import * as XLSX from "xlsx";

import { CashFlowProfile, CashFlowProfileData } from "../model/CashFlowProfile";
import { LineItemData } from "../model/LineItem";
import { MonthKey } from "../model/MonthKey";
import { MonthlyProjectionEntry } from "../projection/ProjectionService";
import { CategoryMapping, ImportResult, ParsedMortgageInputs } from "./ImportResult";

/** Sheet names written by `ExcelExporter` — matched by name, not position. */
const SHEET_NAMES = {
  cashFlow: "Cash Flow",
  projection: "Projection 5y",
  mortgage: "Mortgage",
} as const;

/** Cash Flow summary rows carry this in the category column; skipped as line items. */
const SUMMARY_CATEGORY = "สรุป";
/** The summary row holding current savings/emergency fund. */
const SAVINGS_LABEL = "เงินสำรอง/เงินออม";

/** Mortgage-sheet row labels (must match `ExcelExporter.buildMortgageSheet`). */
const MORTGAGE_LABELS = {
  homePrice: "ราคาบ้าน",
  homeOrder: "บ้านลำดับที่",
  borrowerAge: "อายุผู้กู้",
  interestRatePercent: "อัตราดอกเบี้ย (% ต่อปี)",
  loanTermYears: "ระยะเวลากู้ (ปี)",
  downPaymentAvailable: "เงินดาวน์ที่มี",
  dsrLimitPercent: "เพดาน DSR (%)",
  coBorrowerSection: "--- ผู้กู้ร่วม ---",
  coDebt: "หนี้ปัจจุบันของผู้กู้ร่วม",
} as const;

/** Per-baht tolerance when comparing reconstructed vs. file projection totals. */
const PROJECTION_TOLERANCE = 1;

const NOT_BEAR_TUNG_FILE_WARNING =
  "ไฟล์นี้ไม่ใช่ไฟล์ Bear-tung ที่ถูกต้อง — ไม่พบชีต Cash Flow ที่อ่านได้";

const LOST_CARRY_FORWARD_WARNING =
  "ตรวจพบการเปลี่ยนแปลงในอนาคต (เช่น รายรับหรือรายจ่ายที่เปลี่ยนภายหลัง) ที่ไม่สามารถนำเข้าได้ครบถ้วน — " +
  "ระบบนำเข้าค่าปัจจุบันให้แล้ว กรุณาตรวจสอบและกรอกการเปลี่ยนแปลงเพิ่มเติมในหน้า Cash Flow";

/** Options supplied per `parse` call — UI-provided reverse lookups + id source. */
export interface ImportOptions {
  /** Reverse lookups from the Thai workbook labels back to domain keys. */
  mapping: CategoryMapping;
  /** Parses a Thai month label (e.g. 'มิ.ย. 2026') back into 'YYYY-MM', or undefined. */
  parsePayoffMonth(label: string): string | undefined;
  /** Defaults to `crypto.randomUUID` — overridable for deterministic tests. */
  generateId?(): string;
}

/** A single projection row as read from the file (for loss detection only). */
interface FileProjectionRow {
  totalIncome: number;
  totalExpense: number;
  totalDebt: number;
}

/**
 * Parses a previously-exported Bear-tung workbook back into domain state.
 *
 * Mirror image of `ExcelExporter`: split into a pure `parse` (the testable
 * part — takes a `XLSX.WorkBook` already read from a file/buffer) and depends
 * on an injected projection builder (DIP) so it can detect — without a real
 * `ProjectionService` wired in — when a file's collapsed per-item snapshots
 * have lost future carry-forward changes.
 *
 * Lossy-by-design note: the export stores each line item as a single amount
 * (its value at the export month), not its full carry-forward history. So a
 * reconstructed item gets one change effective at `startMonth`. Debt payoff
 * months DO round-trip (via the payoff column), but mid-projection income/
 * expense step-changes cannot — `parse` detects that case by re-running the
 * projection and comparing it to the file's "Projection 5y" sheet, surfacing
 * `LOST_CARRY_FORWARD_WARNING` only when totals actually diverge.
 */
export class ExcelImporter {
  constructor(private readonly buildProjection: (profile: CashFlowProfile) => MonthlyProjectionEntry[]) {}

  parse(workbook: XLSX.WorkBook, options: ImportOptions): ImportResult {
    const generateId = options.generateId ?? (() => crypto.randomUUID());
    const warnings: string[] = [];

    const cashFlowRows = readSheet(workbook, SHEET_NAMES.cashFlow);
    if (cashFlowRows.length < 2 || !looksLikeCashFlowSheet(cashFlowRows[0])) {
      return {
        recognized: false,
        profile: emptyProfileData(MonthKey.current().toString()),
        warnings: [NOT_BEAR_TUNG_FILE_WARNING],
      };
    }

    const fileProjection = parseFileProjection(readSheet(workbook, SHEET_NAMES.projection));
    const startMonth = fileProjection.startMonth ?? MonthKey.current().toString();

    const { items, savings } = this.parseCashFlow(cashFlowRows, options, startMonth, generateId);

    const profile: CashFlowProfileData = {
      items,
      assets: { savings },
      startMonth,
      meta: { updatedAt: new Date().toISOString() },
    };

    if (this.hasLostCarryForward(profile, fileProjection.rows)) {
      warnings.push(LOST_CARRY_FORWARD_WARNING);
    }

    const mortgageInputs = parseMortgageInputs(readSheet(workbook, SHEET_NAMES.mortgage));

    return { recognized: true, profile, mortgageInputs, warnings };
  }

  private parseCashFlow(
    rows: unknown[][],
    options: ImportOptions,
    startMonth: string,
    generateId: () => string,
  ): { items: LineItemData[]; savings: number } {
    const cols = headerIndex(rows[0]);
    const { categoryThToKey, subCategoryThToKey } = options.mapping;
    const payoffCol = cols["ผ่อนหมดเดือน"]; // absent in older exports — handled by undefined check
    const items: LineItemData[] = [];
    let savings = 0;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const categoryTh = toStr(row[cols.category]);

      if (categoryTh === SUMMARY_CATEGORY) {
        if (toStr(row[cols.label]) === SAVINGS_LABEL) {
          savings = toNumber(row[cols.amountPerMonth]);
        }
        continue;
      }
      if (categoryTh === "") {
        continue; // blank separator row between line items and the summary block
      }

      const category = categoryThToKey[categoryTh];
      if (!category) {
        continue; // unrecognized category label — skip rather than guess
      }

      const subCategoryTh = toStr(row[cols.subCategory]);
      // Fall back to the raw Thai label when it isn't a known preset; the UI's
      // `subCategoryLabel` also falls back to the raw value, so display still works.
      const subCategory = subCategoryThToKey[category]?.[subCategoryTh] ?? subCategoryTh;

      const endMonth =
        payoffCol === undefined ? undefined : resolveEndMonth(toStr(row[payoffCol]), options.parsePayoffMonth);

      items.push({
        id: generateId(),
        category,
        subCategory,
        label: toStr(row[cols.label]),
        changes: [{ effectiveFrom: startMonth, amount: toNumber(row[cols.amountPerMonth]) }],
        endMonth,
      });
    }

    return { items, savings };
  }

  /**
   * True when the reconstructed (single-snapshot) profile's projection
   * diverges from the file's — i.e. the file held future carry-forward
   * changes that the per-item snapshots couldn't preserve. Returns false when
   * there's no file projection to compare against (nothing provable).
   */
  private hasLostCarryForward(profileData: CashFlowProfileData, fileRows: FileProjectionRow[]): boolean {
    if (fileRows.length === 0) {
      return false;
    }

    const rebuilt = this.buildProjection(CashFlowProfile.fromJSON(profileData));
    const count = Math.min(rebuilt.length, fileRows.length);

    for (let i = 0; i < count; i++) {
      const a = rebuilt[i];
      const b = fileRows[i];
      if (
        Math.abs(a.totalIncome - b.totalIncome) > PROJECTION_TOLERANCE ||
        Math.abs(a.totalExpense - b.totalExpense) > PROJECTION_TOLERANCE ||
        Math.abs(a.totalDebt - b.totalDebt) > PROJECTION_TOLERANCE
      ) {
        return true;
      }
    }

    return false;
  }
}

/** Reads a worksheet as an array-of-arrays, or [] if the sheet is absent. */
function readSheet(workbook: XLSX.WorkBook, name: string): unknown[][] {
  const sheet = workbook.Sheets[name];
  if (!sheet) {
    return [];
  }
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
}

function looksLikeCashFlowSheet(headerRow: unknown[]): boolean {
  const cols = headerIndex(headerRow);
  return ["category", "subCategory", "label", "amountPerMonth"].every((key) => key in cols);
}

/** Maps each header cell's text to its column index (blank headers ignored). */
function headerIndex(headerRow: unknown[]): Record<string, number> {
  const map: Record<string, number> = {};
  headerRow.forEach((cell, index) => {
    const key = toStr(cell);
    if (key) {
      map[key] = index;
    }
  });
  return map;
}

function resolveEndMonth(payoffLabel: string, parsePayoffMonth: (label: string) => string | undefined): string | undefined {
  if (payoffLabel === "") {
    return undefined;
  }
  return parsePayoffMonth(payoffLabel);
}

/** Parses the "Projection 5y" sheet: its first data month is the authoritative startMonth. */
function parseFileProjection(rows: unknown[][]): { startMonth?: string; rows: FileProjectionRow[] } {
  if (rows.length < 2) {
    return { rows: [] };
  }

  const cols = headerIndex(rows[0]);
  const monthCol = cols["เดือน"] ?? 0;
  const incomeCol = cols["รายรับ"] ?? 1;
  const expenseCol = cols["รายจ่าย"] ?? 2;
  const debtCol = cols["หนี้สิน"] ?? 3;

  const dataRows: FileProjectionRow[] = [];
  let startMonth: string | undefined;

  for (let r = 1; r < rows.length; r++) {
    const month = toStr(rows[r][monthCol]);
    if (!isMonthKey(month)) {
      continue;
    }
    if (startMonth === undefined) {
      startMonth = month;
    }
    dataRows.push({
      totalIncome: toNumber(rows[r][incomeCol]),
      totalExpense: toNumber(rows[r][expenseCol]),
      totalDebt: toNumber(rows[r][debtCol]),
    });
  }

  return { startMonth, rows: dataRows };
}

/** Parses the "Mortgage" sheet's input section, or undefined for the placeholder sheet. */
function parseMortgageInputs(rows: unknown[][]): ParsedMortgageInputs | undefined {
  if (rows.length < 2) {
    return undefined;
  }

  // The sheet is a 2-column (รายการ / ค่า) key-value list. Input-section labels
  // are unique, so a flat label->value map is enough to pick out the inputs.
  const values = new Map<string, unknown>();
  for (let r = 1; r < rows.length; r++) {
    const label = toStr(rows[r][0]);
    if (label) {
      values.set(label, rows[r][1]);
    }
  }

  if (!values.has(MORTGAGE_LABELS.homePrice)) {
    return undefined; // placeholder ("no mortgage") sheet, or not a mortgage sheet
  }

  const coBorrowerEnabled = values.has(MORTGAGE_LABELS.coBorrowerSection) || values.has(MORTGAGE_LABELS.coDebt);

  return {
    homePrice: toNumber(values.get(MORTGAGE_LABELS.homePrice)),
    homeOrder: clampHomeOrder(toNumber(values.get(MORTGAGE_LABELS.homeOrder))),
    borrowerAge: toNumber(values.get(MORTGAGE_LABELS.borrowerAge)),
    interestRatePercent: toNumber(values.get(MORTGAGE_LABELS.interestRatePercent)),
    loanTermYears: toNumber(values.get(MORTGAGE_LABELS.loanTermYears)),
    downPaymentAvailable: toNumber(values.get(MORTGAGE_LABELS.downPaymentAvailable)),
    dsrLimit: toNumber(values.get(MORTGAGE_LABELS.dsrLimitPercent)) / 100, // sheet stores a percentage
    coBorrowerEnabled,
    coDebt: toNumber(values.get(MORTGAGE_LABELS.coDebt)),
  };
}

function clampHomeOrder(value: number): 1 | 2 | 3 {
  if (value === 2) return 2;
  if (value === 3) return 3;
  return 1;
}

function emptyProfileData(startMonth: string): CashFlowProfileData {
  return { items: [], assets: { savings: 0 }, startMonth, meta: { updatedAt: new Date().toISOString() } };
}

function isMonthKey(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(value);
}

function toStr(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
