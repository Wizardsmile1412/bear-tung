"use client";

import { useCallback } from "react";

import { buildExportData, CashFlowRowInput } from "@/domain/export/buildExportData";
import { ExcelExporter } from "@/domain/export/ExcelExporter";
import { MortgageExportData } from "@/domain/export/ExportData";

import { CATEGORY_LABELS, subCategoryLabel } from "@/components/cashflow/subCategoryPresets";
import { useHealth } from "@/components/health/useHealth";
import { useProjectionSeries } from "@/components/health/useProjectionSeries";
import { useProfile } from "@/components/profile/useProfile";

// Stateless — safe to share one instance across every `useExport` call,
// same justification as the module-level singletons in useHealth.ts /
// useProjectionSeries.ts.
const excelExporter = new ExcelExporter();

export interface UseExportResult {
  exportToExcel(): void;
}

/**
 * Wires the domain export pipeline (`buildExportData` + `ExcelExporter`) to
 * the current profile/health/projection state and triggers a download.
 *
 * Sheet 1 ("Cash Flow") and Sheet 2 ("Health Check") always reflect "now"
 * (`profile.startMonth`, via `useHealth()` called with no argument) —
 * regardless of whatever month a dashboard/mortgage month slider happens to
 * be showing at the moment the user clicks Export.
 *
 * Resolves the Thai-label translation for cash-flow rows here (the UI
 * layer is allowed to import `subCategoryPresets`, a UI-only presentation
 * lookup) rather than inside `buildExportData`, which only ever sees
 * already-Thai-labeled rows and stays free of any `src/components/**`
 * import — keeping the domain/UI layering rule intact.
 */
export function useExport(mortgage?: MortgageExportData): UseExportResult {
  const { profile } = useProfile();
  const { series } = useProjectionSeries();
  const health = useHealth();

  const exportToExcel = useCallback(() => {
    const cashFlowRows: CashFlowRowInput[] = profile.items.map((item) => ({
      category: CATEGORY_LABELS[item.category],
      subCategory: subCategoryLabel(item.category, item.subCategory),
      label: item.label,
      amountPerMonth: item.amountAt(health.month),
    }));

    const data = buildExportData({
      profile,
      cashFlowRows,
      health,
      projection: series,
      mortgage,
    });

    excelExporter.export(data, `bear-tung-${profile.startMonth}.xlsx`);
  }, [profile, series, health, mortgage]);

  return { exportToExcel };
}
