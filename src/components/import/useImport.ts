"use client";

import { useCallback } from "react";
import * as XLSX from "xlsx";

import { createExcelImporter } from "@/domain/import/createExcelImporter";
import { CategoryMapping } from "@/domain/import/ImportResult";
import { CashFlowProfile } from "@/domain/model/CashFlowProfile";
import { LineItemCategory } from "@/domain/model/LineItem";
import { LocalStorageMortgageInputsRepository } from "@/domain/storage/LocalStorageMortgageInputsRepository";

import { CATEGORY_LABELS, SUB_CATEGORY_PRESETS } from "@/components/cashflow/subCategoryPresets";
import { parseMonthLabel } from "@/components/health/formatMonthLabel";
import { useProfile } from "@/components/profile/useProfile";

// Stateless singletons — same justification as `useExport`'s `ExcelExporter`.
const excelImporter = createExcelImporter();
const mortgageInputsRepository = new LocalStorageMortgageInputsRepository();

/** Thrown when the chosen file isn't a readable Bear-tung export. */
export const INVALID_FILE_MESSAGE = "ไฟล์ไม่ถูกต้อง — กรุณาเลือกไฟล์ Excel ที่ส่งออกจาก Bear-tung";

/**
 * Reverse of the UI's category/sub-category presentation lookups, so the
 * importer can map Thai workbook labels back to domain keys. Built once: the
 * presets are static (see `subCategoryPresets`).
 */
const mapping: CategoryMapping = buildCategoryMapping();

function buildCategoryMapping(): CategoryMapping {
  const categoryThToKey: Record<string, LineItemCategory> = {};
  (Object.entries(CATEGORY_LABELS) as [LineItemCategory, string][]).forEach(([key, labelTh]) => {
    categoryThToKey[labelTh] = key;
  });

  const subCategoryThToKey = { income: {}, expense: {}, debt: {} } as CategoryMapping["subCategoryThToKey"];
  (Object.keys(SUB_CATEGORY_PRESETS) as LineItemCategory[]).forEach((category) => {
    SUB_CATEGORY_PRESETS[category].forEach((option) => {
      subCategoryThToKey[category][option.labelTh] = option.value;
    });
  });

  return { categoryThToKey, subCategoryThToKey };
}

export interface ImportSummary {
  itemCount: number;
  warnings: string[];
  hasMortgage: boolean;
}

export interface UseImportResult {
  /**
   * Reads an `.xlsx` file, replaces the current profile, and stashes any
   * mortgage inputs for the mortgage page to pre-fill. Rejects with
   * `INVALID_FILE_MESSAGE` (without touching existing data) if the file isn't
   * a recognizable Bear-tung export.
   */
  importFromFile(file: File): Promise<ImportSummary>;
}

/**
 * Wires the domain import pipeline (`ExcelImporter`) to profile state. Mirrors
 * `useExport`: resolves the Thai-label reversal here in the UI layer (allowed
 * to import `subCategoryPresets`/`formatMonthLabel`) and hands the importer
 * pure lookups, keeping `src/domain/**` free of any `src/components/**` import.
 */
export function useImport(): UseImportResult {
  const { replaceProfile } = useProfile();

  const importFromFile = useCallback(
    async (file: File): Promise<ImportSummary> => {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const result = excelImporter.parse(workbook, { mapping, parsePayoffMonth: parseMonthLabel });

      if (!result.recognized) {
        throw new Error(INVALID_FILE_MESSAGE);
      }

      replaceProfile(CashFlowProfile.fromJSON(result.profile));

      if (result.mortgageInputs) {
        mortgageInputsRepository.save(result.mortgageInputs);
      } else {
        // A re-import without mortgage data must not leave stale pre-fill behind.
        mortgageInputsRepository.clear();
      }

      return {
        itemCount: result.profile.items.length,
        warnings: result.warnings,
        hasMortgage: result.mortgageInputs !== undefined,
      };
    },
    [replaceProfile],
  );

  return { importFromFile };
}
