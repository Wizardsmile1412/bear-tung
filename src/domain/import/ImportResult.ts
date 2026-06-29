import { CashFlowProfileData } from "../model/CashFlowProfile";
import { LineItemCategory } from "../model/LineItem";

/**
 * Plain type definitions for importing a previously-exported Bear-tung Excel
 * workbook back into a `CashFlowProfile` (+ optional mortgage form inputs).
 *
 * The mirror image of the export types in `ExportData.ts`: where export turns
 * domain state into a 4-sheet workbook, import turns that workbook back into
 * domain state. No logic lives here — see `ExcelImporter.ts`.
 */

/**
 * Reverse lookups that turn the Thai presentation labels written into the
 * workbook back into the domain's English category/sub-category keys.
 *
 * Supplied by the caller (the `useImport` hook) rather than imported here,
 * for the same layering reason `buildExportData` takes already-Thai-labeled
 * rows: the Thai labels are a UI-layer presentation concern (they live in
 * `src/components/cashflow/subCategoryPresets`), and `src/domain/**` must
 * never import from `src/components/**`.
 */
export interface CategoryMapping {
  /** e.g. 'รายรับ' -> 'income' */
  categoryThToKey: Record<string, LineItemCategory>;
  /** e.g. { income: { 'เงินเดือน': 'salary' }, ... } */
  subCategoryThToKey: Record<LineItemCategory, Record<string, string>>;
}

/**
 * The mortgage form inputs recoverable from the "Mortgage" sheet. Only the
 * user-entered *inputs* are imported — results are recomputed by the app, and
 * `monthlyIncome`/`existingDebt` come from the cash flow of the assessed
 * month (not stored as form state), so they are deliberately absent here.
 */
export interface ParsedMortgageInputs {
  homePrice: number;
  homeOrder: 1 | 2 | 3;
  borrowerAge: number;
  interestRatePercent: number;
  loanTermYears: number;
  downPaymentAvailable: number;
  dsrLimit: number; // 0-1 (the sheet stores it as a percentage; normalized here)
  coBorrowerEnabled: boolean;
  coDebt: number;
}

export interface ImportResult {
  /**
   * Whether the workbook was recognized as a Bear-tung export (a readable
   * "Cash Flow" sheet was found). When `false`, callers must NOT apply
   * `profile` — it's an empty placeholder — so existing data isn't wiped by
   * an unrelated file.
   */
  recognized: boolean;
  /** The reconstructed profile, ready for `CashFlowProfile.fromJSON`. */
  profile: CashFlowProfileData;
  /** Present only when the "Mortgage" sheet held real (non-placeholder) inputs. */
  mortgageInputs?: ParsedMortgageInputs;
  /** Non-fatal issues to surface to the user (e.g. lost carry-forward history). */
  warnings: string[];
}
